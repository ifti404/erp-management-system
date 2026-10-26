package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "account_entries", uniqueConstraints = @UniqueConstraint(name = "uk_account_entry_source", columnNames = {"source_type", "source_id", "entry_leg"}), indexes = {
        @Index(name = "idx_account_entries_account_date", columnList = "account_id,entry_date")
})
public class AccountEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "account_id", nullable = false) private FinancialAccount account;
    @Column(name = "entry_date", nullable = false) private LocalDateTime entryDate;
    @Column(name = "entry_type", nullable = false, length = 20) private String entryType;
    @Column(nullable = false, length = 3) private String direction;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 180) private String description;
    @Column(length = 100) private String reference;
    @Column(name = "source_type", nullable = false, length = 20) private String sourceType;
    @Column(name = "source_id") private Long sourceId;
    @Column(name = "entry_leg", nullable = false, length = 10) private String entryLeg = "MAIN";
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "created_by", nullable = false, length = 50) private String createdBy;
    public AccountEntry() {}
    public Long getId() { return id; }
    public FinancialAccount getAccount() { return account; }
    public void setAccount(FinancialAccount account) { this.account = account; }
    public LocalDateTime getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDateTime entryDate) { this.entryDate = entryDate; }
    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public String getEntryLeg() { return entryLeg; }
    public void setEntryLeg(String entryLeg) { this.entryLeg = entryLeg; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
