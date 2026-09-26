package com.ifti.erp.controller;

import com.ifti.erp.entity.SalesItem;
import com.ifti.erp.service.SalesItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-items")
public class SalesItemController {

    private final SalesItemService salesItemService;

    public SalesItemController(SalesItemService salesItemService) {
        this.salesItemService = salesItemService;
    }

    @GetMapping
    public List<SalesItem> getAllSalesItems() {
        return salesItemService.getAllSalesItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesItem> getSalesItemById(
            @PathVariable Long id) {

        return salesItemService.getSalesItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SalesItem createSalesItem(
            @RequestBody SalesItem salesItem) {

        return salesItemService.createSalesItem(salesItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesItem> updateSalesItem(
            @PathVariable Long id,
            @RequestBody SalesItem salesItemDetails) {

        try {
            return ResponseEntity.ok(
                    salesItemService.updateSalesItem(
                            id,
                            salesItemDetails
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalesItem(@PathVariable Long id) {
        salesItemService.deleteSalesItem(id);
        return ResponseEntity.noContent().build();
    }
}