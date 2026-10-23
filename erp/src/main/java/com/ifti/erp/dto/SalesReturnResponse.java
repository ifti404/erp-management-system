package com.ifti.erp.dto;

import com.ifti.erp.entity.SalesReturn;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SalesReturnResponse(Long id, Long salesOrderId, String customerName,
        String reason, String settlementType, String settlementStatus,
        BigDecimal returnAmount, BigDecimal refundAmount, LocalDateTime createdAt, String createdBy,
        List<Item> items) {
    public record Item(Long salesItemId, String productName, String sku, int quantity,
                       boolean restock, BigDecimal unitPrice, BigDecimal lineTotal) {}

    public static SalesReturnResponse from(SalesReturn value) {
        return new SalesReturnResponse(value.getId(), value.getSalesOrder().getId(),
                value.getSalesOrder().getCustomer().getName(), value.getReason(),
                value.getSettlementType(), value.getSettlementStatus(), value.getReturnAmount(), value.getRefundAmount(),
                value.getCreatedAt(), value.getCreatedBy(), value.getItems().stream().map(item ->
                new Item(item.getSalesItem().getId(), item.getSalesItem().getProduct().getName(),
                        item.getSalesItem().getProduct().getSku(), item.getQuantity(), item.isRestock(),
                        item.getUnitPrice(), item.getLineTotal())).toList());
    }
}
