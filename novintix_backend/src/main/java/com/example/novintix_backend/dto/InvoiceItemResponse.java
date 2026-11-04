package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.InvoiceItem;
import java.math.BigDecimal;

public record InvoiceItemResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getProductCode(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }
}

