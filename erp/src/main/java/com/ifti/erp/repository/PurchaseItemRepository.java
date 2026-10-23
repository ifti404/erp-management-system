<<<<<<< HEAD

package com.ifti.erp.repository;

import com.ifti.erp.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PurchaseItem p WHERE p.id = :id")
    Optional<PurchaseItem> findByIdForUpdate(@Param("id") Long id);
}
=======

package com.ifti.erp.repository;

import com.ifti.erp.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

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
}
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
