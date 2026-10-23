package com.ifti.erp.repository;

import com.ifti.erp.entity.SalesItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface SalesItemRepository extends JpaRepository<SalesItem, Long> {

    List<SalesItem> findBySalesOrderId(Long salesOrderId);
    boolean existsByProductId(Long productId);

    @Query(value = "SELECT * FROM sales_items WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<SalesItem> findByIdForUpdate(@Param("id") Long id);

    @Query("""
        SELECT COALESCE(SUM(s.subtotal), 0)
        FROM SalesItem s
        WHERE s.salesOrder.id = :salesOrderId
    """)
    BigDecimal calculateTotalBySalesOrderId(
            @Param("salesOrderId") Long salesOrderId
    );
}
