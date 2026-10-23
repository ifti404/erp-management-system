package com.ifti.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserPasswordRequest(
        @NotBlank @Size(min = 8, max = 72) String password) {}
