package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesItemRepository salesItemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementService movementService;
    private final AuditService auditService;
    private final SalesReturnRepository salesReturnRepository;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesItemRepository salesItemRepository,
            InventoryRepository inventoryRepository,
            InventoryMovementService movementService, AuditService auditService,
            SalesReturnRepository salesReturnRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesItemRepository = salesItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementService = movementService;
        this.auditService = auditService;
        this.salesReturnRepository = salesReturnRepository;
    }

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }

    public Optional<SalesOrder> getSalesOrderById(Long id) {
        return salesOrderRepository.findById(id);
    }

    @Transactional
    public SalesOrder createSalesOrder(SalesOrder salesOrder) {
        BigDecimal deliveryCharge =
                normalizeDeliveryCharge(salesOrder.getDeliveryCharge());

        salesOrder.setDeliveryCharge(deliveryCharge);
        salesOrder.setTotalAmount(deliveryCharge);
        salesOrder.setInventoryReleased(false);

        SalesOrder saved = salesOrderRepository.save(salesOrder);
        saved.setTransactionId(transactionId("ORD", saved.getTransactionId(), saved.getId()));
        saved = salesOrderRepository.save(saved);
        auditService.record("CREATED", "SALES_ORDER", saved.getId(), "status=" + saved.getStatus() + ", total=" + saved.getTotalAmount() + ", due=" + saved.getDueDate());
        return saved;
    }

    @Transactional
    public SalesOrder updateSalesOrder(
            Long id,
            SalesOrder salesOrderDetails) {

        SalesOrder order = salesOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));
        if (salesReturnRepository.existsBySalesOrderId(id)) {
            throw new RuntimeException("This order has return history and cannot be edited");
        }
        String newStatus = salesOrderDetails.getStatus();
        String previous = "status=" + order.getStatus() + ", total=" + order.getTotalAmount() + ", due=" + order.getDueDate();

        if (newStatus == null || newStatus.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        boolean willBeClosed = isStockReleasedStatus(newStatus);
        boolean wasClosed = isStockReleasedStatus(order.getStatus());

        if (!order.isInventoryReleased() && willBeClosed && !wasClosed) {
            releaseInventory(order);
        } else if (order.isInventoryReleased() && !willBeClosed) {
            deductInventory(order);
        }

        order.setStatus(newStatus);
        order.setCustomer(salesOrderDetails.getCustomer());
        order.setOrderDate(salesOrderDetails.getOrderDate());
        order.setDueDate(salesOrderDetails.getDueDate());
        order.setDeliveryCharge(
                normalizeDeliveryCharge(
                        salesOrderDetails.getDeliveryCharge()));
        order.setCourier(salesOrderDetails.getCourier());
        order.setParcelId(salesOrderDetails.getParcelId());
        order.setNotes(salesOrderDetails.getNotes());
        order.setTransactionId(transactionId("ORD", salesOrderDetails.getTransactionId(), id));

        BigDecimal itemsSubtotal =
                salesItemRepository.calculateTotalBySalesOrderId(id);

        order.setTotalAmount(
                itemsSubtotal.add(order.getDeliveryCharge()));

        SalesOrder saved = salesOrderRepository.save(order);
        auditService.record("UPDATED", "SALES_ORDER", id, previous + " -> status=" + saved.getStatus() + ", total=" + saved.getTotalAmount() + ", due=" + saved.getDueDate());
        return saved;
    }

    @Transactional
    public void deleteSalesOrder(Long id) {
        SalesOrder order = salesOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));

        if (salesReturnRepository.existsBySalesOrderId(id)) {
            throw new RuntimeException("This order has return history and cannot be deleted");
        }

        if (!salesItemRepository.findBySalesOrderId(id).isEmpty()) {
            throw new RuntimeException(
                    "Delete the sales items before deleting this order");
        }

        auditService.record("DELETED", "SALES_ORDER", id, "status=" + order.getStatus() + ", total=" + order.getTotalAmount());
        salesOrderRepository.delete(order);
    }

    private void releaseInventory(SalesOrder order) {
        List<SalesItem> items =
                salesItemRepository.findBySalesOrderId(order.getId());

        for (SalesItem item : items) {
            Inventory inventory = getInventory(
                    item.getProduct().getId());

            inventory.setQuantity(
                    inventory.getQuantity() + item.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);
            movementService.record(item.getProduct(), "SALES_ORDER_RELEASE",
                    item.getQuantity(), inventory.getQuantity(), "SALES_ORDER", order.getId(), null);
        }

        order.setInventoryReleased(true);
    }

    private void deductInventory(SalesOrder order) {
        List<SalesItem> items =
                salesItemRepository.findBySalesOrderId(order.getId());

        // Aggregate repeated products before changing stock, so a reactivation
        // cannot pass per-line checks and then drive a shared balance negative.
        Map<Long, Integer> requiredByProduct = new HashMap<>();
        for (SalesItem item : items) {
            requiredByProduct.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
        }
        for (Map.Entry<Long, Integer> required : requiredByProduct.entrySet()) {
            Inventory inventory = getInventory(required.getKey());
            if (inventory.getQuantity() < required.getValue()) {
                throw new RuntimeException(
                        "Insufficient inventory to reactivate order. Product: "
                                + required.getKey());
            }
        }

        for (SalesItem item : items) {
            Inventory inventory = getInventory(
                    item.getProduct().getId());

            inventory.setQuantity(
                    inventory.getQuantity() - item.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);
            movementService.record(item.getProduct(), "SALES_ORDER_REACTIVATION",
                    -item.getQuantity(), inventory.getQuantity(), "SALES_ORDER", order.getId(), null);
        }

        order.setInventoryReleased(false);
    }

    private Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product " + productId));
    }

    private boolean isStockReleasedStatus(String status) {
        return status != null
                && (status.equalsIgnoreCase("CANCELLED")
                || status.equalsIgnoreCase("RETURNED"));
    }

    private BigDecimal normalizeDeliveryCharge(BigDecimal charge) {
        if (charge == null) {
            return BigDecimal.ZERO;
        }

        if (charge.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "Delivery charge cannot be negative");
        }

        return charge;
    }

    private String transactionId(String prefix, String supplied, Long fallback) {
        String suffix = supplied == null ? "" : supplied.trim().replaceFirst("(?i)^" + prefix + "-", "");
        if (suffix.isBlank()) suffix = String.format(java.util.Locale.ROOT, "%02d", fallback);
        if (!suffix.matches("[0-9]{1,30}")) throw new IllegalArgumentException("Transaction number must contain digits only");
        return prefix + "-" + suffix;
    }
}
