package com.ifti.erp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UserRoleRequest(@NotNull @Positive Long roleId) {}
