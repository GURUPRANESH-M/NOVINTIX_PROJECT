package com.example.novintix_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        Long invoiceId,

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Payment method is required")
        String paymentMethod,

        String referenceNumber,

        String notes
) {
}

