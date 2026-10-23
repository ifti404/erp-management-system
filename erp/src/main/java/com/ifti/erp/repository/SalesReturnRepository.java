package com.ifti.erp.repository;

import com.ifti.erp.entity.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    List<SalesReturn> findAllByOrderByCreatedAtDesc();
    List<SalesReturn> findBySalesOrderIdOrderByCreatedAtDesc(Long salesOrderId);
    boolean existsBySalesOrderId(Long salesOrderId);
    @Query("select coalesce(sum(r.returnAmount), 0) from SalesReturn r where r.salesOrder.id = :orderId")
    java.math.BigDecimal totalReturnedValue(@Param("orderId") Long orderId);
    @Query(value = "SELECT * FROM sales_returns WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<SalesReturn> findByIdForUpdate(@Param("id") Long id);
}
