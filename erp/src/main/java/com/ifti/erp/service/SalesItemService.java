package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.SalesItemRepository;
import com.ifti.erp.repository.SalesOrderRepository;
import com.ifti.erp.repository.SalesReturnItemRepository;
import com.ifti.erp.repository.SalesReturnRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SalesItemService {

    private final SalesItemRepository salesItemRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final InventoryMovementService movementService;
    private final AuditService auditService;
    private final SalesReturnItemRepository salesReturnItemRepository;
    private final SalesReturnRepository salesReturnRepository;

    public SalesItemService(
            SalesItemRepository salesItemRepository,
            InventoryRepository inventoryRepository,
            SalesOrderRepository salesOrderRepository,
            InventoryMovementService movementService, AuditService auditService,
            SalesReturnItemRepository salesReturnItemRepository,
            SalesReturnRepository salesReturnRepository) {
        this.salesItemRepository = salesItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.movementService = movementService;
        this.auditService = auditService;
        this.salesReturnItemRepository = salesReturnItemRepository;
        this.salesReturnRepository = salesReturnRepository;
    }

    public List<SalesItem> getAllSalesItems() {
        return salesItemRepository.findAll();
    }

    public Optional<SalesItem> getSalesItemById(Long id) {
        return salesItemRepository.findById(id);
    }

    @Transactional
    public SalesItem createSalesItem(SalesItem salesItem) {
        Long orderId = salesItem.getSalesOrder().getId();

        SalesOrder order = getOrder(orderId);
        ensureNoReturnHistory(order);
        ensureOrderCanBeEdited(order);

        Inventory inventory = getInventory(
                salesItem.getProduct().getId());

        if (inventory.getQuantity() < salesItem.getQuantity()) {
            throw new RuntimeException("Insufficient inventory");
        }

        inventory.setQuantity(
                inventory.getQuantity() - salesItem.getQuantity());
        inventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(inventory);
        movementService.record(salesItem.getProduct(), "SALE", -salesItem.getQuantity(),
                inventory.getQuantity(), "SALES_ORDER", orderId, null);

        salesItem.setSalesOrder(order);
        salesItem.setSubtotal(
                salesItem.getUnitPrice().multiply(
                        BigDecimal.valueOf(salesItem.getQuantity())));

        SalesItem savedItem = salesItemRepository.save(salesItem);

        updateSalesOrderTotal(orderId);

        auditService.record("CREATED", "SALES_ITEM", savedItem.getId(), "sales order #" + orderId + ", quantity=" + savedItem.getQuantity() + ", unit price=" + savedItem.getUnitPrice());
        return savedItem;
    }

    @Transactional
    public SalesItem updateSalesItem(
            Long id,
            SalesItem salesItemDetails) {

        SalesItem existingItem = salesItemRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales item not found"));
        if (salesReturnItemRepository.existsBySalesItemId(id)) {
            throw new RuntimeException("This sales item has return history and cannot be edited");
        }

        Long oldOrderId = existingItem.getSalesOrder().getId();
        Long newOrderId = salesItemDetails.getSalesOrder().getId();

        SalesOrder oldOrder = getOrder(oldOrderId);
        SalesOrder newOrder = getOrder(newOrderId);

        ensureNoReturnHistory(oldOrder);
        ensureNoReturnHistory(newOrder);
        ensureOrderCanBeEdited(oldOrder);
        ensureOrderCanBeEdited(newOrder);

        Inventory oldInventory = getInventory(
                existingItem.getProduct().getId());

        Inventory newInventory = getInventory(
                salesItemDetails.getProduct().getId());

        // Calculate stock available after reversing the old item.
        int oldQuantity = existingItem.getQuantity();
        int newQuantity = salesItemDetails.getQuantity();

        int availableForNewItem = newInventory.getQuantity();

        if (oldInventory.getId().equals(newInventory.getId())) {
            availableForNewItem += oldQuantity;
        }

        if (availableForNewItem < newQuantity) {
            throw new RuntimeException("Insufficient inventory");
        }

        oldInventory.setQuantity(
                oldInventory.getQuantity() + oldQuantity);
        oldInventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(oldInventory);
        movementService.record(existingItem.getProduct(), "SALE_ITEM_REVERSAL", oldQuantity,
                oldInventory.getQuantity(), "SALES_ORDER", oldOrderId, null);

        newInventory.setQuantity(
                newInventory.getQuantity() - newQuantity);
        newInventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(newInventory);
        movementService.record(salesItemDetails.getProduct(), "SALE", -newQuantity,
                newInventory.getQuantity(), "SALES_ORDER", newOrderId, null);

        existingItem.setSalesOrder(newOrder);
        existingItem.setProduct(salesItemDetails.getProduct());
        existingItem.setQuantity(newQuantity);
        existingItem.setUnitPrice(salesItemDetails.getUnitPrice());
        existingItem.setSubtotal(
                salesItemDetails.getUnitPrice().multiply(
                        BigDecimal.valueOf(newQuantity)));

        SalesItem updatedItem = salesItemRepository.save(existingItem);

        updateSalesOrderTotal(oldOrderId);

        if (!oldOrderId.equals(newOrderId)) {
            updateSalesOrderTotal(newOrderId);
        }

        auditService.record("UPDATED", "SALES_ITEM", id, "sales order #" + oldOrderId + " -> #" + newOrderId + ", quantity=" + updatedItem.getQuantity() + ", unit price=" + updatedItem.getUnitPrice());
        return updatedItem;
    }

    @Transactional
    public void deleteSalesItem(Long id) {
        SalesItem salesItem = salesItemRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales item not found"));
        if (salesReturnItemRepository.existsBySalesItemId(id)) {
            throw new RuntimeException("This sales item has return history and cannot be deleted");
        }

        SalesOrder order = getOrder(
                salesItem.getSalesOrder().getId());
        ensureNoReturnHistory(order);

        // If stock was already released, do not add it a second time.
        if (!order.isInventoryReleased()) {
            Inventory inventory = getInventory(
                    salesItem.getProduct().getId());

            inventory.setQuantity(
                    inventory.getQuantity() + salesItem.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);
            movementService.record(salesItem.getProduct(), "SALE_ITEM_REMOVAL",
                    salesItem.getQuantity(), inventory.getQuantity(),
                    "SALES_ORDER", order.getId(), null);
        }

        Long orderId = order.getId();

        auditService.record("DELETED", "SALES_ITEM", id, "sales order #" + orderId + ", quantity=" + salesItem.getQuantity() + ", unit price=" + salesItem.getUnitPrice());
        salesItemRepository.delete(salesItem);

        updateSalesOrderTotal(orderId);
    }

    private void ensureOrderCanBeEdited(SalesOrder order) {
        if (order.isInventoryReleased()
                || isStockReleasedStatus(order.getStatus())) {
            throw new RuntimeException(
                    "Cannot add or edit items on a cancelled or returned order. "
                            + "Reactivate the order first.");
        }
    }

    private void ensureNoReturnHistory(SalesOrder order) {
        if (salesReturnRepository.existsBySalesOrderId(order.getId())) {
            throw new RuntimeException("This order has return history and its items cannot be changed");
        }
    }

    private boolean isStockReleasedStatus(String status) {
        return status != null
                && (status.equalsIgnoreCase("CANCELLED")
                || status.equalsIgnoreCase("RETURNED"));
    }

    private SalesOrder getOrder(Long orderId) {
        return salesOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));
    }

    private Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product"));
    }

    private void updateSalesOrderTotal(Long orderId) {
        SalesOrder order = getOrder(orderId);

        BigDecimal itemsSubtotal =
                salesItemRepository.calculateTotalBySalesOrderId(orderId);

        BigDecimal deliveryCharge = order.getDeliveryCharge() == null
                ? BigDecimal.ZERO
                : order.getDeliveryCharge();

        order.setTotalAmount(itemsSubtotal.add(deliveryCharge));

        salesOrderRepository.save(order);
    }
}
