package com.example.novintix_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ShipmentItemRequest(
        @NotNull(message = "Order item ID is required")
        Long orderItemId,

        @NotNull(message = "Quantity shipped is required")
        @Min(value = 1, message = "Quantity shipped must be at least 1")
        Integer quantityShipped
) {
}

