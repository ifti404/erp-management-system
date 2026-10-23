package com.ifti.erp.repository;

import com.ifti.erp.entity.SalesReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SalesReturnItemRepository extends JpaRepository<SalesReturnItem, Long> {
    boolean existsBySalesItemId(Long salesItemId);
    @Query("select coalesce(sum(i.quantity), 0) from SalesReturnItem i where i.salesItem.id = :salesItemId")
    long returnedQuantity(@Param("salesItemId") Long salesItemId);

    Optional<SalesReturnItem> findFirstBySalesReturnId(Long salesReturnId);
}
