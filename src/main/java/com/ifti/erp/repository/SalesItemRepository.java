package com.ifti.erp.repository;

import com.ifti.erp.entity.SalesItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface SalesItemRepository extends JpaRepository<SalesItem, Long> {

    @Query("""
        SELECT COALESCE(SUM(s.subtotal), 0)
        FROM SalesItem s
        WHERE s.salesOrder.id = :salesOrderId
    """)
    BigDecimal calculateTotalBySalesOrderId(
            @Param("salesOrderId") Long salesOrderId
    );
}