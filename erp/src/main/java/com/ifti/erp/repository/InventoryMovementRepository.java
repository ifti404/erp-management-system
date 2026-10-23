package com.ifti.erp.repository;

import com.ifti.erp.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findTop200ByOrderByCreatedAtDesc();
    boolean existsByProductId(Long productId);
}
