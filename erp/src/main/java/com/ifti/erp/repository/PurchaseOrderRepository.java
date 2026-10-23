package com.ifti.erp.repository;

import com.ifti.erp.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query(value = "SELECT * FROM purchase_orders WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<PurchaseOrder> findByIdForUpdate(@Param("id") Long id);
}
