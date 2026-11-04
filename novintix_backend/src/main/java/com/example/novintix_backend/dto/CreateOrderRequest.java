package com.example.novintix_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateOrderRequest(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        @NotEmpty(message = "At least one order item is required")
        @Valid
        List<OrderItemRequest> items
) {
}

