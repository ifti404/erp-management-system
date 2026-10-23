package com.ifti.erp.controller;

import com.ifti.erp.entity.InventoryMovement;
import com.ifti.erp.service.InventoryMovementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/inventory-movements")
public class InventoryMovementController {
    private final InventoryMovementService service;

    public InventoryMovementController(InventoryMovementService service) {
        this.service = service;
    }

    @GetMapping
    public List<InventoryMovement> getRecentMovements() {
        return service.latest();
    }
}
