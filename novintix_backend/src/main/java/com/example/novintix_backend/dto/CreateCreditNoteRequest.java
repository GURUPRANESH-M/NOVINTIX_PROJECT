package com.example.novintix_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateCreditNoteRequest(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        Long invoiceId,

        @NotBlank(message = "Reason is required (e.g. Damaged goods in transit, Near-expiry stock)")
        String reason,

        @NotEmpty(message = "At least one credit item is required")
        @Valid
        List<CreditNoteItemRequest> items
) {
}

