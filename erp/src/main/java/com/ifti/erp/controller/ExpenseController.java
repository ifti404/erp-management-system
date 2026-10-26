package com.ifti.erp.controller;

import com.ifti.erp.entity.Expense;
import com.ifti.erp.entity.ExpenseCategory;
import com.ifti.erp.repository.ExpenseCategoryRepository;
import com.ifti.erp.repository.ExpenseRepository;
import com.ifti.erp.service.AuditService;
import com.ifti.erp.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ExpenseController {
    private final ExpenseRepository expenses;
    private final ExpenseCategoryRepository categories;
    private final AuditService audit;
    private final AccountService accounts;
    public ExpenseController(ExpenseRepository expenses, ExpenseCategoryRepository categories, AuditService audit, AccountService accounts) {
        this.expenses = expenses; this.categories = categories; this.audit = audit; this.accounts = accounts;
    }
    @GetMapping("/expenses") public List<Expense> expenses() { return expenses.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "expenseDate", "id")); }
    @Transactional
    @PostMapping("/expenses") public Expense create(@Valid @RequestBody Expense expense, Authentication authentication) {
        var category = categories.findById(expense.getCategory().getId()).orElseThrow(() -> new IllegalArgumentException("Expense category not found"));
        if (!category.isActive()) throw new IllegalArgumentException("Choose an active expense category");
        expense.setCategory(category); expense.setAccount(accounts.requireActive(expense.getAccount() == null ? null : expense.getAccount().getId())); expense.setCreatedAt(LocalDateTime.now()); expense.setCreatedBy(authentication.getName());
        var saved = expenses.saveAndFlush(expense);
        String suffix = saved.getTransactionId() == null ? "" : saved.getTransactionId().trim().replaceFirst("(?i)^EXP-", "");
        if (suffix.isBlank()) suffix = String.format(java.util.Locale.ROOT, "%02d", saved.getId());
        if (!suffix.matches("[0-9]{1,30}")) throw new IllegalArgumentException("Transaction number must contain digits only");
        saved.setTransactionId("EXP-" + suffix); saved = expenses.saveAndFlush(saved); accounts.recordExpense(saved, authentication.getName());
        audit.record("CREATED", "EXPENSE", saved.getId(), "transaction=" + saved.getTransactionId() + ", amount=" + saved.getAmount() + ", category=" + category.getName()); return saved;
    }
    @Transactional
    @DeleteMapping("/expenses/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        Expense expense = expenses.findById(id).orElseThrow(() -> new IllegalArgumentException("Expense not found"));
        audit.record("DELETED", "EXPENSE", id, "amount=" + expense.getAmount() + ", category=" + expense.getCategory().getName()); accounts.removeLinkedEntry("EXPENSE", id); expenses.delete(expense); return ResponseEntity.noContent().build();
    }
    @GetMapping("/expense-categories") public List<ExpenseCategory> categories() { return categories.findAll(org.springframework.data.domain.Sort.by("name")); }
    @PostMapping("/expense-categories") public ExpenseCategory createCategory(@Valid @RequestBody ExpenseCategory category) {
        if (categories.existsByNameIgnoreCase(category.getName().trim())) throw new IllegalArgumentException("An expense category with this name already exists");
        category.setName(category.getName().trim()); var saved = categories.save(category); audit.record("CREATED", "EXPENSE_CATEGORY", saved.getId(), "name=" + saved.getName()); return saved;
    }
    @PutMapping("/expense-categories/{id}") public ExpenseCategory updateCategory(@PathVariable Long id, @Valid @RequestBody ExpenseCategory input) {
        var category = categories.findById(id).orElseThrow(() -> new IllegalArgumentException("Expense category not found"));
        String name = input.getName().trim();
        if (!category.getName().equalsIgnoreCase(name) && categories.existsByNameIgnoreCase(name)) throw new IllegalArgumentException("An expense category with this name already exists");
        category.setName(name); category.setDescription(input.getDescription()); category.setActive(input.isActive());
        var saved = categories.save(category); audit.record("UPDATED", "EXPENSE_CATEGORY", id, "name=" + saved.getName()); return saved;
    }
}
