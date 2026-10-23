package com.ifti.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ReceivePurchaseItemsRequest(
        @NotEmpty List<@Valid Line> items) {
    public record Line(
            @NotNull @Positive Long purchaseItemId,
            @NotNull @Positive Integer quantity) {
    }
}
