package com.ifti.erp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "company_settings")
public class CompanySettings {
    @Id
    private Long id = 1L;

    @Column(name = "business_name", nullable = false, length = 120)
    private String businessName = "Gamma ERP Business";
    @Column(length = 255)
    private String address;
    @Column(length = 40)
    private String phone;
    @Column(length = 120)
    private String email;
    @Column(name = "tax_number", length = 60)
    private String taxNumber;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "BDT";
    @Column(name = "logo_data", columnDefinition = "LONGTEXT")
    private String logoData;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected CompanySettings() {}

    public static CompanySettings createDefault() { return new CompanySettings(); }

    @PrePersist @PreUpdate
    void touch() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTaxNumber() { return taxNumber; }
    public void setTaxNumber(String taxNumber) { this.taxNumber = taxNumber; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getLogoData() { return logoData; }
    public void setLogoData(String logoData) { this.logoData = logoData; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
