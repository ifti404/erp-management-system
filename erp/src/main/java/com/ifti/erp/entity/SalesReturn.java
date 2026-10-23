package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_returns")
public class SalesReturn {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(name = "settlement_type", nullable = false, length = 20)
    private String settlementType;

    @Column(name = "settlement_status", nullable = false, length = 20)
    private String settlementStatus;

    @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "return_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal returnAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @OneToMany(mappedBy = "salesReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesReturnItem> items = new ArrayList<>();

    protected SalesReturn() {}

    public SalesReturn(SalesOrder salesOrder, String reason, String settlementType,
                       String settlementStatus, BigDecimal returnAmount, BigDecimal refundAmount,
                       LocalDateTime createdAt, String createdBy) {
        this.salesOrder = salesOrder;
        this.reason = reason;
        this.settlementType = settlementType;
        this.settlementStatus = settlementStatus;
        this.refundAmount = refundAmount;
        this.returnAmount = returnAmount;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
    }

    public void addItem(SalesReturnItem item) { items.add(item); item.setSalesReturn(this); }
    public Long getId() { return id; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public String getReason() { return reason; }
    public String getSettlementType() { return settlementType; }
    public String getSettlementStatus() { return settlementStatus; }
    public void setSettlementStatus(String settlementStatus) { this.settlementStatus = settlementStatus; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public BigDecimal getReturnAmount() { return returnAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
    public List<SalesReturnItem> getItems() { return items; }
}
