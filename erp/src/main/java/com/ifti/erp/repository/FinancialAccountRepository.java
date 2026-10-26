package com.ifti.erp.repository;
import com.ifti.erp.entity.FinancialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, Long> {
    boolean existsByNameIgnoreCase(String name);
}
