package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesItemRepository salesItemRepository;
    private final InventoryRepository inventoryRepository;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesItemRepository salesItemRepository,
            InventoryRepository inventoryRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesItemRepository = salesItemRepository;
        this.inventoryRepository = inventoryRepository;
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

        return salesOrderRepository.save(salesOrder);
    }

    @Transactional
    public SalesOrder updateSalesOrder(
            Long id,
            SalesOrder salesOrderDetails) {

        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));
        String newStatus = salesOrderDetails.getStatus();

        if (newStatus == null || newStatus.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        boolean willBeClosed = isStockReleasedStatus(newStatus);

        if (!order.isInventoryReleased() && willBeClosed) {
            releaseInventory(order);
        } else if (order.isInventoryReleased() && !willBeClosed) {
            deductInventory(order);
        }

        order.setStatus(newStatus);
        order.setCustomer(salesOrderDetails.getCustomer());
        order.setOrderDate(salesOrderDetails.getOrderDate());
        order.setDeliveryCharge(
                normalizeDeliveryCharge(
                        salesOrderDetails.getDeliveryCharge()));
        order.setCourier(salesOrderDetails.getCourier());
        order.setParcelId(salesOrderDetails.getParcelId());
        order.setNotes(salesOrderDetails.getNotes());

        BigDecimal itemsSubtotal =
                salesItemRepository.calculateTotalBySalesOrderId(id);

        order.setTotalAmount(
                itemsSubtotal.add(order.getDeliveryCharge()));

        return salesOrderRepository.save(order);
    }

    @Transactional
    public void deleteSalesOrder(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));

        if (!salesItemRepository.findBySalesOrderId(id).isEmpty()) {
            throw new RuntimeException(
                    "Delete the sales items before deleting this order");
        }

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
        }

        order.setInventoryReleased(true);
    }

    private void deductInventory(SalesOrder order) {
        List<SalesItem> items =
                salesItemRepository.findBySalesOrderId(order.getId());

        // Check all products first, so reactivation cannot partially proceed.
        for (SalesItem item : items) {
            Inventory inventory = getInventory(
                    item.getProduct().getId());

            if (inventory.getQuantity() < item.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient inventory to reactivate order. Product: "
                                + item.getProduct().getId());
            }
        }

        for (SalesItem item : items) {
            Inventory inventory = getInventory(
                    item.getProduct().getId());

            inventory.setQuantity(
                    inventory.getQuantity() - item.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);
        }

        order.setInventoryReleased(false);
    }

    private Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductId(productId)
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
}