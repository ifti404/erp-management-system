package com.ifti.erp.controller;

import com.ifti.erp.entity.PurchaseItem;
import com.ifti.erp.service.PurchaseItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-items")
public class PurchaseItemController {

    private final PurchaseItemService purchaseItemService;

    public PurchaseItemController(PurchaseItemService purchaseItemService) {
        this.purchaseItemService = purchaseItemService;
    }

    @GetMapping
    public List<PurchaseItem> getAllPurchaseItems() {
        return purchaseItemService.getAllPurchaseItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseItem> getPurchaseItemById(
            @PathVariable Long id) {

        return purchaseItemService.getPurchaseItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PurchaseItem createPurchaseItem(
            @RequestBody PurchaseItem purchaseItem) {

        return purchaseItemService.createPurchaseItem(purchaseItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseItem> updatePurchaseItem(
            @PathVariable Long id,
            @RequestBody PurchaseItem purchaseItemDetails) {

        try {
            return ResponseEntity.ok(
                    purchaseItemService.updatePurchaseItem(
                            id,
                            purchaseItemDetails
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseItem(@PathVariable Long id) {
        purchaseItemService.deletePurchaseItem(id);
        return ResponseEntity.noContent().build();
    }
}