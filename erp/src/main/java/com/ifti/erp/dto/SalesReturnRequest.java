package com.ifti.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SalesReturnRequest(
        @NotNull Long salesOrderId,
        @NotBlank @Size(max = 255) String reason,
        @NotEmpty List<@Valid Item> items) {
    public record Item(@NotNull Long salesItemId, @NotNull @Min(1) Integer quantity,
                       boolean restock) {}
}
