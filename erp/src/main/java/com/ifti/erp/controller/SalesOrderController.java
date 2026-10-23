package com.ifti.erp.controller;

import com.ifti.erp.entity.SalesOrder;
import com.ifti.erp.service.SalesOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderService.getAllSalesOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrder> getSalesOrderById(
            @PathVariable Long id) {

        return salesOrderService.getSalesOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SalesOrder createSalesOrder(
            @Valid @RequestBody SalesOrder salesOrder) {

        return salesOrderService.createSalesOrder(salesOrder);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesOrder> updateSalesOrder(
            @PathVariable Long id,
            @Valid @RequestBody SalesOrder salesOrderDetails) {

        return salesOrderService.getSalesOrderById(id)
                .map(existing -> ResponseEntity.ok(
                        salesOrderService.updateSalesOrder(id, salesOrderDetails)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalesOrder(@PathVariable Long id) {
        salesOrderService.deleteSalesOrder(id);
        return ResponseEntity.noContent().build();
    }
}
