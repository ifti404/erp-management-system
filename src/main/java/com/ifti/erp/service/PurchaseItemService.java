package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import com.ifti.erp.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseItemService {

    private final PurchaseItemRepository purchaseItemRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseItemService(
            PurchaseItemRepository purchaseItemRepository,
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository) {

        this.purchaseItemRepository = purchaseItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemRepository.findAll();
    }

    public Optional<PurchaseItem> getPurchaseItemById(Long id) {
        return purchaseItemRepository.findById(id);
    }

    @Transactional
    public PurchaseItem createPurchaseItem(PurchaseItem purchaseItem) {

        Inventory inventory = getInventory(
                purchaseItem.getProduct().getId()
        );

        inventory.setQuantity(
                inventory.getQuantity() + purchaseItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        PurchaseItem savedItem =
                purchaseItemRepository.save(purchaseItem);

        updatePurchaseOrderTotal(
                purchaseItem.getPurchaseOrder().getId()
        );

        return savedItem;
    }

    @Transactional
    public PurchaseItem updatePurchaseItem(
            Long id,
            PurchaseItem purchaseItemDetails) {

        PurchaseItem existingItem =
                purchaseItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long oldOrderId =
                existingItem.getPurchaseOrder().getId();

        Long newOrderId =
                purchaseItemDetails.getPurchaseOrder().getId();

        // Remove old quantity from inventory
        Inventory oldInventory = getInventory(
                existingItem.getProduct().getId()
        );

        oldInventory.setQuantity(
                oldInventory.getQuantity()
                        - existingItem.getQuantity()
        );

        oldInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(oldInventory);

        // Add new quantity to inventory
        Inventory newInventory = getInventory(
                purchaseItemDetails.getProduct().getId()
        );

        newInventory.setQuantity(
                newInventory.getQuantity()
                        + purchaseItemDetails.getQuantity()
        );

        newInventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(newInventory);

        // Update item
        existingItem.setPurchaseOrder(
                purchaseItemDetails.getPurchaseOrder()
        );

        existingItem.setProduct(
                purchaseItemDetails.getProduct()
        );

        existingItem.setQuantity(
                purchaseItemDetails.getQuantity()
        );

        existingItem.setUnitCost(
                purchaseItemDetails.getUnitCost()
        );

        existingItem.setSubtotal(
                purchaseItemDetails.getSubtotal()
        );

        PurchaseItem savedItem =
                purchaseItemRepository.save(existingItem);

        // Recalculate totals
        updatePurchaseOrderTotal(oldOrderId);

        if (!oldOrderId.equals(newOrderId)) {
            updatePurchaseOrderTotal(newOrderId);
        }

        return savedItem;
    }

    @Transactional
    public void deletePurchaseItem(Long id) {

        PurchaseItem purchaseItem =
                purchaseItemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase item not found"));

        Long orderId =
                purchaseItem.getPurchaseOrder().getId();

        Inventory inventory = getInventory(
                purchaseItem.getProduct().getId()
        );

        inventory.setQuantity(
                inventory.getQuantity()
                        - purchaseItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        purchaseItemRepository.delete(purchaseItem);

        // Recalculate order total
        updatePurchaseOrderTotal(orderId);
    }

    private void updatePurchaseOrderTotal(Long orderId) {

        PurchaseOrder order =
                purchaseOrderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase order not found"));

        BigDecimal total =
                purchaseItemRepository
                        .calculateTotalByPurchaseOrderId(orderId);

        order.setTotalAmount(total);

        purchaseOrderRepository.save(order);
    }

    private Inventory getInventory(Long productId) {

        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product"));
    }
}