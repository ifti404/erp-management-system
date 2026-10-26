package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "internal_transfers")
public class InternalTransfer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "from_account_id", nullable = false) private FinancialAccount fromAccount;
    @ManyToOne(optional = false) @JoinColumn(name = "to_account_id", nullable = false) private FinancialAccount toAccount;
    @Column(name = "transfer_date", nullable = false) private LocalDateTime transferDate;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal amount;
    @Column(length = 100) private String reference;
    @Column(length = 255) private String notes;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "created_by", nullable = false, length = 50) private String createdBy;
    public InternalTransfer() {}
    public Long getId() { return id; }
    public FinancialAccount getFromAccount() { return fromAccount; }
    public void setFromAccount(FinancialAccount fromAccount) { this.fromAccount = fromAccount; }
    public FinancialAccount getToAccount() { return toAccount; }
    public void setToAccount(FinancialAccount toAccount) { this.toAccount = toAccount; }
    public LocalDateTime getTransferDate() { return transferDate; }
    public void setTransferDate(LocalDateTime transferDate) { this.transferDate = transferDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
