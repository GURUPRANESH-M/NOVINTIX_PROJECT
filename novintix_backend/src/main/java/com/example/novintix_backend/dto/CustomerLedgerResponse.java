package com.example.novintix_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record CustomerLedgerResponse(
        Long customerId,
        String customerCode,
        String companyName,
        String customerType,
        BigDecimal creditLimit,
        BigDecimal totalInvoiced,
        BigDecimal totalPayments,
        BigDecimal totalCreditNotes,
        BigDecimal unpaidInvoicesBalance,
        BigDecimal openOrdersValue,
        BigDecimal totalExposure,
        BigDecimal availableCredit,
        List<LedgerEntryDto> entries
) {
}

