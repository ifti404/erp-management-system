<<<<<<< HEAD
package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementService movementService;
    private final AuditService auditService;

    public InventoryService(InventoryRepository inventoryRepository,
                            InventoryMovementService movementService, AuditService auditService) {
        this.inventoryRepository = inventoryRepository;
        this.movementService = movementService;
        this.auditService = auditService;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public Optional<Inventory> getInventoryById(Long id) {
        return inventoryRepository.findById(id);
    }

    @Transactional
    public Inventory createInventory(Inventory inventory) {
        if (inventory.getUpdatedAt() == null) {
            inventory.setUpdatedAt(LocalDateTime.now());
        }

        Inventory saved = inventoryRepository.save(inventory);
        movementService.record(saved.getProduct(), "INITIAL_STOCK", saved.getQuantity(),
                saved.getQuantity(), "INVENTORY", saved.getId(), null);
        auditService.record("CREATED", "INVENTORY", saved.getId(), "product #" + saved.getProduct().getId() + ", initial quantity=" + saved.getQuantity());
        return saved;
    }

    @Transactional
    public Inventory updateInventory(Long id, Inventory inventoryDetails) {
        Inventory inventory = inventoryRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        if (!inventory.getProduct().getId().equals(inventoryDetails.getProduct().getId())) {
            throw new RuntimeException("An inventory record cannot be reassigned to another product");
        }

        inventory.setProduct(inventoryDetails.getProduct());
        int oldQuantity = inventory.getQuantity();
        inventory.setQuantity(inventoryDetails.getQuantity());
        inventory.setUpdatedAt(LocalDateTime.now());
        Inventory saved = inventoryRepository.save(inventory);
        movementService.record(saved.getProduct(), "ADJUSTMENT",
                saved.getQuantity() - oldQuantity, saved.getQuantity(),
                "INVENTORY", saved.getId(), "Manual stock adjustment");
        auditService.record("ADJUSTED", "INVENTORY", saved.getId(), "product #" + saved.getProduct().getId()
                + ", quantity " + oldQuantity + " -> " + saved.getQuantity());
        return saved;
    }

    public void deleteInventory(Long id) {
        throw new RuntimeException("Inventory records are managed with their products and cannot be deleted directly");
    }
}
=======
package com.ifti.erp.service;

import com.ifti.erp.entity.Inventory;
import com.ifti.erp.repository.InventoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public Optional<Inventory> getInventoryById(Long id) {
        return inventoryRepository.findById(id);
    }

    public Inventory createInventory(Inventory inventory) {
        if (inventory.getUpdatedAt() == null) {
            inventory.setUpdatedAt(LocalDateTime.now());
        }

        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Long id, Inventory inventoryDetails) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        inventory.setProduct(inventoryDetails.getProduct());
        inventory.setQuantity(inventoryDetails.getQuantity());
        inventory.setUpdatedAt(LocalDateTime.now());

        return inventoryRepository.save(inventory);
    }

    public void deleteInventory(Long id) {
        inventoryRepository.deleteById(id);
    }
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
