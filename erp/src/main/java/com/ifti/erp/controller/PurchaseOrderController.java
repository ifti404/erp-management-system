package com.ifti.erp.controller;

import com.ifti.erp.entity.PurchaseOrder;
import com.ifti.erp.dto.ReceivePurchaseItemsRequest;
import com.ifti.erp.service.PurchaseItemService;
import com.ifti.erp.service.PurchaseOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;


import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseItemService purchaseItemService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService,
                                   PurchaseItemService purchaseItemService) {
        this.purchaseOrderService = purchaseOrderService;
        this.purchaseItemService = purchaseItemService;
    }

    @PostMapping("/{id}/receipts")
    public PurchaseOrder receiveItems(@PathVariable Long id,
            @Valid @RequestBody ReceivePurchaseItemsRequest request) {
        return purchaseItemService.receiveItems(id, request);
    }

    @GetMapping
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderService.getAllPurchaseOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(
            @PathVariable Long id) {

        return purchaseOrderService.getPurchaseOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PurchaseOrder createPurchaseOrder(
           @Valid @RequestBody PurchaseOrder purchaseOrder) {

        return purchaseOrderService.createPurchaseOrder(purchaseOrder);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrder> updatePurchaseOrder(
            @PathVariable Long id,
           @Valid @RequestBody PurchaseOrder purchaseOrderDetails) {
        return purchaseOrderService.getPurchaseOrderById(id)
                .map(existing -> ResponseEntity.ok(
                        purchaseOrderService.updatePurchaseOrder(id, purchaseOrderDetails)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseOrder(@PathVariable Long id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }
}
