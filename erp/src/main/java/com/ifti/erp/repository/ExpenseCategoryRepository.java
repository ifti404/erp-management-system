package com.ifti.erp.repository;
import com.ifti.erp.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    boolean existsByNameIgnoreCase(String name);
}
