package com.ifti.erp.repository;

import com.ifti.erp.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    @Query(value = "SELECT * FROM inventory WHERE product_id = :productId FOR UPDATE", nativeQuery = true)
    Optional<Inventory> findByProductIdForUpdate(@Param("productId") Long productId);

    @Query(value = "SELECT * FROM inventory WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Inventory> findByIdForUpdate(@Param("id") Long id);
}
