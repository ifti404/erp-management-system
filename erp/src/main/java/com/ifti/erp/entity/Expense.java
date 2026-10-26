package com.ifti.erp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "transaction_id", unique = true, length = 40) private String transactionId;
    @NotNull @ManyToOne(optional = false) @JoinColumn(name = "category_id", nullable = false) private ExpenseCategory category;
    @NotNull @ManyToOne(optional = false) @JoinColumn(name = "account_id", nullable = false) private FinancialAccount account;
    @NotNull @DecimalMin("0.01") @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @NotNull @Column(name = "expense_date", nullable = false) private LocalDate expenseDate;
    @Column(name = "payment_method", nullable = false, length = 20) private String paymentMethod = "CASH";
    @Size(max = 100) @Column(length = 100) private String reference;
    @Size(max = 255) @Column(length = 255) private String notes;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "created_by", nullable = false, length = 50) private String createdBy;
    public Expense() {}
    public Long getId() { return id; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory category) { this.category = category; }
    public FinancialAccount getAccount() { return account; }
    public void setAccount(FinancialAccount account) { this.account = account; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
