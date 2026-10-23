package com.ifti.erp.service;

import com.ifti.erp.entity.InventoryMovement;
import com.ifti.erp.entity.Product;
import com.ifti.erp.repository.InventoryMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventoryMovementService {
    private final InventoryMovementRepository repository;
    private final AuditService auditService;

    public InventoryMovementService(InventoryMovementRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional
    public void record(Product product, String type, int change, int quantityAfter,
                       String referenceType, Long referenceId, String notes) {
        if (change == 0) return;
        repository.save(new InventoryMovement(product, type, change, quantityAfter,
                referenceType, referenceId, notes, LocalDateTime.now(), currentActor()));
        auditService.record("STOCK_" + type, "INVENTORY", product.getId(),
                "product #" + product.getId() + ", change=" + change + ", quantity after=" + quantityAfter
                        + (referenceType == null ? "" : ", reference=" + referenceType + " #" + referenceId)
                        + (notes == null ? "" : ", note=" + notes));
    }

    public List<InventoryMovement> latest() {
        return repository.findTop200ByOrderByCreatedAtDesc();
    }

    private String currentActor() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || !authentication.isAuthenticated() ? "SYSTEM" : authentication.getName();
    }
}
