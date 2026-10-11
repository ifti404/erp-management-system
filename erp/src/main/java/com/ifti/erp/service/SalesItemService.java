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
public class SalesItemService {

    private final SalesItemRepository salesItemRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;

    public SalesItemService(
            SalesItemRepository salesItemRepository,
            InventoryRepository inventoryRepository,
            SalesOrderRepository salesOrderRepository) {
        this.salesItemRepository = salesItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.salesOrderRepository = salesOrderRepository;
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

        salesItem.setSalesOrder(order);
        salesItem.setSubtotal(
                salesItem.getUnitPrice().multiply(
                        BigDecimal.valueOf(salesItem.getQuantity())));

        SalesItem savedItem = salesItemRepository.save(salesItem);

        updateSalesOrderTotal(orderId);

        return savedItem;
    }

    @Transactional
    public SalesItem updateSalesItem(
            Long id,
            SalesItem salesItemDetails) {

        SalesItem existingItem = salesItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales item not found"));

        Long oldOrderId = existingItem.getSalesOrder().getId();
        Long newOrderId = salesItemDetails.getSalesOrder().getId();

        SalesOrder oldOrder = getOrder(oldOrderId);
        SalesOrder newOrder = getOrder(newOrderId);

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

        newInventory.setQuantity(
                newInventory.getQuantity() - newQuantity);
        newInventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(newInventory);

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

        return updatedItem;
    }

    @Transactional
    public void deleteSalesItem(Long id) {
        SalesItem salesItem = salesItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Sales item not found"));

        SalesOrder order = getOrder(
                salesItem.getSalesOrder().getId());

        // If stock was already released, do not add it a second time.
        if (!order.isInventoryReleased()) {
            Inventory inventory = getInventory(
                    salesItem.getProduct().getId());

            inventory.setQuantity(
                    inventory.getQuantity() + salesItem.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);
        }

        Long orderId = order.getId();

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

    private boolean isStockReleasedStatus(String status) {
        return status != null
                && (status.equalsIgnoreCase("CANCELLED")
                || status.equalsIgnoreCase("RETURNED"));
    }

    private SalesOrder getOrder(Long orderId) {
        return salesOrderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Sales order not found"));
    }

    private Inventory getInventory(Long productId) {
        return inventoryRepository.findByProductId(productId)
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