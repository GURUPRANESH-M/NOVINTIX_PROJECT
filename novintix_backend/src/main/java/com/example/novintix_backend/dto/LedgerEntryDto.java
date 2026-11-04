package com.example.novintix_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LedgerEntryDto(
        LocalDateTime date,
        String transactionType,
        String referenceNumber,
        String description,
        BigDecimal debit,
        BigDecimal credit,
        BigDecimal runningBalance
) {
}

