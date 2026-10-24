package com.ifti.erp.repository;
import com.ifti.erp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ExpenseRepository extends JpaRepository<Expense, Long> {}
