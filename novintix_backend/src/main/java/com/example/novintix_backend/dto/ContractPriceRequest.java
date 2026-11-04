package com.example.novintix_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ContractPriceRequest(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        @NotNull(message = "Product ID is required")
        Long productId,

        @NotNull(message = "Contract price is required")
        @DecimalMin(value = "0.01", message = "Contract price must be greater than zero")
        BigDecimal contractPrice
) {
}

