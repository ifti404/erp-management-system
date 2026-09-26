package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.repository.InventoryRepository;
import com.ifti.erp.repository.PurchaseItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseItemService {

    private final PurchaseItemRepository purchaseItemRepository;
    private final InventoryRepository inventoryRepository;

    public PurchaseItemService(
            PurchaseItemRepository purchaseItemRepository,
            InventoryRepository inventoryRepository) {

        this.purchaseItemRepository = purchaseItemRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemRepository.findAll();
    }

    public Optional<PurchaseItem> getPurchaseItemById(Long id) {
        return purchaseItemRepository.findById(id);
    }

    @Transactional
    public PurchaseItem createPurchaseItem(PurchaseItem purchaseItem) {

        PurchaseItem savedItem = purchaseItemRepository.save(purchaseItem);

        Long productId = purchaseItem.getProduct().getId();

        Inventory inventory = inventoryRepository
                .findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException("Inventory not found for product"));

        inventory.setQuantity(
                inventory.getQuantity() + purchaseItem.getQuantity()
        );

        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        return savedItem;
    }

    public PurchaseItem updatePurchaseItem(
            Long id,
            PurchaseItem purchaseItemDetails) {

        PurchaseItem purchaseItem = purchaseItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Purchase item not found"));

        purchaseItem.setPurchaseOrder(
                purchaseItemDetails.getPurchaseOrder());

        purchaseItem.setProduct(
                purchaseItemDetails.getProduct());

        purchaseItem.setQuantity(
                purchaseItemDetails.getQuantity());

        purchaseItem.setUnitCost(
                purchaseItemDetails.getUnitCost());

        purchaseItem.setSubtotal(
                purchaseItemDetails.getSubtotal());

        return purchaseItemRepository.save(purchaseItem);
    }

    public void deletePurchaseItem(Long id) {
        purchaseItemRepository.deleteById(id);
    }
}