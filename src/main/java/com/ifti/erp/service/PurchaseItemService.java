package com.ifti.erp.service;

import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.repository.PurchaseItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PurchaseItemService {

    private final PurchaseItemRepository purchaseItemRepository;

    public PurchaseItemService(PurchaseItemRepository purchaseItemRepository) {
        this.purchaseItemRepository = purchaseItemRepository;
    }

    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemRepository.findAll();
    }

    public Optional<PurchaseItem> getPurchaseItemById(Long id) {
        return purchaseItemRepository.findById(id);
    }

    public PurchaseItem createPurchaseItem(PurchaseItem purchaseItem) {
        return purchaseItemRepository.save(purchaseItem);
    }

    public PurchaseItem updatePurchaseItem(
            Long id,
            PurchaseItem purchaseItemDetails) {

        PurchaseItem purchaseItem = purchaseItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase item not found"));

        purchaseItem.setPurchaseOrder(purchaseItemDetails.getPurchaseOrder());
        purchaseItem.setProduct(purchaseItemDetails.getProduct());
        purchaseItem.setQuantity(purchaseItemDetails.getQuantity());
        purchaseItem.setUnitCost(purchaseItemDetails.getUnitCost());
        purchaseItem.setSubtotal(purchaseItemDetails.getSubtotal());

        return purchaseItemRepository.save(purchaseItem);
    }

    public void deletePurchaseItem(Long id) {
        purchaseItemRepository.deleteById(id);
    }
}