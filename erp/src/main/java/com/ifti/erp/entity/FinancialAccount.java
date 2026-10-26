package com.ifti.erp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_accounts")
public class FinancialAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Size(max = 100) @Column(nullable = false, length = 100, unique = true) private String name;
    @NotBlank @Size(max = 20) @Column(name = "account_type", nullable = false, length = 20) private String accountType = "CASH";
    @NotBlank @Size(min = 3, max = 3) @Column(name = "currency_code", nullable = false, length = 3) private String currencyCode = "BDT";
    @DecimalMin("0.00") @Column(name = "opening_balance", nullable = false, precision = 14, scale = 2) private BigDecimal openingBalance = BigDecimal.ZERO;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    public FinancialAccount() {}
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
