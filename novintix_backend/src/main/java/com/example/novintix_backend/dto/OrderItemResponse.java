package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        Integer quantity,
        Integer shippedQuantity,
        Integer remainingQuantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getProductCode(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getShippedQuantity() != null ? item.getShippedQuantity() : 0,
                item.getRemainingQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }
}

