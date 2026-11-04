package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.ShipmentItem;

public record ShipmentItemResponse(
        Long id,
        Long orderItemId,
        Long productId,
        String productCode,
        String productName,
        Integer quantityShipped
) {
    public static ShipmentItemResponse from(ShipmentItem item) {
        return new ShipmentItemResponse(
                item.getId(),
                item.getOrderItem() != null ? item.getOrderItem().getId() : null,
                item.getProduct().getId(),
                item.getProduct().getProductCode(),
                item.getProduct().getName(),
                item.getQuantityShipped()
        );
    }
}

