package com.example.novintix_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateShipmentRequest(
        @NotNull(message = "Order ID is required")
        Long orderId,

        String carrier,

        String trackingNumber,

        String notes,

        @NotEmpty(message = "At least one shipment item is required")
        @Valid
        List<ShipmentItemRequest> items
) {
}

