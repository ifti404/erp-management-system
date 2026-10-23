package com.ifti.erp.dto;

import jakarta.validation.constraints.NotNull;

public record UserActiveRequest(@NotNull Boolean active) {}
