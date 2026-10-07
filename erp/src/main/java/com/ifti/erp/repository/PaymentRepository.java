package com.ifti.erp.repository;

import com.ifti.erp.entity.Payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.salesOrder.id = :salesOrderId
        AND p.status = 'PAID'
    """)
    BigDecimal calculatePaidAmountBySalesOrderId(
            @Param("salesOrderId") Long salesOrderId
    );

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.purchaseOrder.id = :purchaseOrderId
        AND p.status = 'PAID'
    """)
    BigDecimal calculatePaidAmountByPurchaseOrderId(
            @Param("purchaseOrderId") Long purchaseOrderId
    );
}