package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.CreditNote;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreditNoteResponse(
        Long id,
        String creditNoteNumber,
        Long customerId,
        String customerCode,
        String customerName,
        Long invoiceId,
        String invoiceNumber,
        String reason,
        BigDecimal totalAmount,
        LocalDateTime issueDate,
        List<CreditNoteItemResponse> items
) {
    public static CreditNoteResponse from(CreditNote cn) {
        List<CreditNoteItemResponse> itemResponses = cn.getItems() != null
                ? cn.getItems().stream().map(CreditNoteItemResponse::from).toList()
                : List.of();

        return new CreditNoteResponse(
                cn.getId(),
                cn.getCreditNoteNumber(),
                cn.getCustomer().getId(),
                cn.getCustomer().getCustomerCode(),
                cn.getCustomer().getCompanyName(),
                cn.getInvoice() != null ? cn.getInvoice().getId() : null,
                cn.getInvoice() != null ? cn.getInvoice().getInvoiceNumber() : null,
                cn.getReason(),
                cn.getTotalAmount(),
                cn.getIssueDate(),
                itemResponses
        );
    }
}

