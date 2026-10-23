package com.ifti.erp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PublicRegistrationRequest(
        @NotBlank @Size(min = 3, max = 50)
        @Pattern(regexp = "[A-Za-z0-9._-]+", message = "Use letters, numbers, dots, underscores, or hyphens for the username")
        String username,
        @NotBlank @Size(max = 20) String phone,
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(min = 10, max = 72) String password) {}
