package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.CreditNoteItem;
import java.math.BigDecimal;

public record CreditNoteItemResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        String conditionReason
) {
    public static CreditNoteItemResponse from(CreditNoteItem item) {
        return new CreditNoteItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getProductCode(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal(),
                item.getConditionReason()
        );
    }
}

