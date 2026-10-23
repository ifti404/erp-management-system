package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sales_return_items")
public class SalesReturnItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "sales_return_id", nullable = false)
    private SalesReturn salesReturn;

    @ManyToOne(optional = false) @JoinColumn(name = "sales_item_id", nullable = false)
    private SalesItem salesItem;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "restock", nullable = false)
    private boolean restock;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected SalesReturnItem() {}

    public SalesReturnItem(SalesItem salesItem, int quantity, boolean restock,
                           BigDecimal unitPrice, BigDecimal lineTotal) {
        this.salesItem = salesItem;
        this.quantity = quantity;
        this.restock = restock;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
    }

    void setSalesReturn(SalesReturn salesReturn) { this.salesReturn = salesReturn; }
    public Long getId() { return id; }
    public SalesItem getSalesItem() { return salesItem; }
    public Integer getQuantity() { return quantity; }
    public boolean isRestock() { return restock; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
