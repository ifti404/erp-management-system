
package com.ifti.erp.repository;

import com.ifti.erp.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PurchaseItemRepository
        extends JpaRepository<PurchaseItem, Long> {

    @Query("""
        SELECT COALESCE(SUM(p.subtotal), 0)
        FROM PurchaseItem p
        WHERE p.purchaseOrder.id = :purchaseOrderId
    """)
    BigDecimal calculateTotalByPurchaseOrderId(
            @Param("purchaseOrderId") Long purchaseOrderId
    );

    List<PurchaseItem> findByPurchaseOrderId(Long purchaseOrderId);
    boolean existsByProductId(Long productId);

    @Query(value = "SELECT * FROM purchase_items WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<PurchaseItem> findByIdForUpdate(@Param("id") Long id);
}
