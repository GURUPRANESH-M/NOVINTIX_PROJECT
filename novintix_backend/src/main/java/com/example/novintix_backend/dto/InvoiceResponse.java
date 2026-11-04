package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.Invoice;
import com.example.novintix_backend.entity.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long customerId,
        String customerCode,
        String customerName,
        Long orderId,
        String orderNumber,
        Long shipmentId,
        String shipmentNumber,
        LocalDateTime invoiceDate,
        LocalDate dueDate,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal balanceDue,
        InvoiceStatus status,
        List<InvoiceItemResponse> items
) {
    public static InvoiceResponse from(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems() != null
                ? invoice.getItems().stream().map(InvoiceItemResponse::from).toList()
                : List.of();

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getCustomer().getId(),
                invoice.getCustomer().getCustomerCode(),
                invoice.getCustomer().getCompanyName(),
                invoice.getOrder() != null ? invoice.getOrder().getId() : null,
                invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null,
                invoice.getShipment() != null ? invoice.getShipment().getId() : null,
                invoice.getShipment() != null ? invoice.getShipment().getShipmentNumber() : null,
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.getTotalAmount(),
                invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO,
                invoice.getBalanceDue(),
                invoice.getStatus(),
                itemResponses
        );
    }
}

