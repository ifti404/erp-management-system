package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


@Entity
@Table(name = "sales_orders")
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @NotNull(message = "Customer is required")
    private Customer customer;


    @Column(name = "order_date", nullable = false)
    @NotNull(message = "Order date is required")
    private LocalDateTime orderDate;

    @Column(nullable = false, length = 20)
    @NotBlank(message = "Status is required")
    @Size(max = 20, message = "Status must not exceed 20 characters")
    private String status;


    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @DecimalMin(value = "0.0", message = "Total amount cannot be negative")
    private BigDecimal totalAmount;

    @Column(name = "delivery_charge", nullable = false, precision = 12, scale = 2)
    @DecimalMin(value = "0.0", message = "Delivery charge cannot be negative")
    private BigDecimal deliveryCharge = BigDecimal.ZERO;
    
    @Column(length = 30)
    @Size(max = 30, message = "Courier must not exceed 30 characters")
    private String courier;

    @Column(name = "parcel_id", length = 100)
    @Size(max = 100, message = "Parcel ID must not exceed 100 characters")
    private String parcelId;

    @Column(length = 255)
    @Size(max = 255, message = "Notes must not exceed 255 characters")
    private String notes;



    public String getCourier() {
    return courier;
    }

    public void setCourier(String courier) {
    this.courier = courier;
    }

    public String getParcelId() {
    return parcelId;
    }

    public void setParcelId(String parcelId) {
    this.parcelId = parcelId;
    }

    public SalesOrder() {
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    public BigDecimal getDeliveryCharge() {
    return deliveryCharge;
    }

    public void setDeliveryCharge(BigDecimal deliveryCharge) {
    this.deliveryCharge = deliveryCharge;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}