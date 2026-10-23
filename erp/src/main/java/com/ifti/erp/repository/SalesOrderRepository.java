package com.ifti.erp.repository;

import com.ifti.erp.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    @Query(value = "SELECT * FROM sales_orders WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<SalesOrder> findByIdForUpdate(@Param("id") Long id);
}
