package com.ifti.erp.repository;

import com.ifti.erp.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    @Query("""
        SELECT COALESCE(SUM(p.subtotal), 0)
        FROM PurchaseItem p
        WHERE p.purchaseOrder.id = :purchaseOrderId
    """)
    BigDecimal calculateTotalByPurchaseOrderId(
            @Param("purchaseOrderId") Long purchaseOrderId
    );
}