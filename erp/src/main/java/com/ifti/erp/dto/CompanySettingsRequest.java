package com.ifti.erp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanySettingsRequest(
        @NotBlank @Size(max = 120) String businessName,
        @Size(max = 255) String address,
        @Size(max = 40) String phone,
        @Email @Size(max = 120) String email,
        @Size(max = 60) String taxNumber,
        @NotBlank @Size(min = 3, max = 3) String currencyCode,
        String logoData) {}
