package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        String paymentNumber,
        Long customerId,
        String customerCode,
        String customerName,
        Long invoiceId,
        String invoiceNumber,
        BigDecimal amount,
        LocalDateTime paymentDate,
        String paymentMethod,
        String referenceNumber,
        String notes
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentNumber(),
                payment.getCustomer().getId(),
                payment.getCustomer().getCustomerCode(),
                payment.getCustomer().getCompanyName(),
                payment.getInvoice() != null ? payment.getInvoice().getId() : null,
                payment.getInvoice() != null ? payment.getInvoice().getInvoiceNumber() : null,
                payment.getAmount(),
                payment.getPaymentDate(),
                payment.getPaymentMethod(),
                payment.getReferenceNumber(),
                payment.getNotes()
        );
    }
}

