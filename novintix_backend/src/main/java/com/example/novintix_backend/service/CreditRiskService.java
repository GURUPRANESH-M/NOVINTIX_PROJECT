package com.example.novintix_backend.service;

import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.InvoiceStatus;
import com.example.novintix_backend.entity.OrderStatus;
import com.example.novintix_backend.entity.SalesOrder;
import com.example.novintix_backend.repository.CreditNoteRepository;
import com.example.novintix_backend.repository.InvoiceRepository;
import com.example.novintix_backend.repository.PaymentRepository;
import com.example.novintix_backend.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CreditRiskService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PaymentRepository paymentRepository;
    private final CreditNoteRepository creditNoteRepository;

    public CreditRiskService(
            InvoiceRepository invoiceRepository,
            SalesOrderRepository salesOrderRepository,
            PaymentRepository paymentRepository,
            CreditNoteRepository creditNoteRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.paymentRepository = paymentRepository;
        this.creditNoteRepository = creditNoteRepository;
    }

    public record CreditAssessment(
            boolean approved,
            BigDecimal creditLimit,
            BigDecimal unpaidInvoices,
            BigDecimal openOrders,
            BigDecimal currentExposure,
            BigDecimal newOrderAmount,
            BigDecimal projectedExposure,
            BigDecimal availableCreditAfterOrder,
            String reason
    ) {}

    @Transactional(readOnly = true)
    public BigDecimal calculateUnpaidInvoices(Long customerId) {
        return invoiceRepository
                .findByCustomerIdAndStatusIn(customerId, List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID))
                .stream()
                .map(inv -> {
                    BigDecimal total = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
                    BigDecimal paid = inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO;
                    return total.subtract(paid).max(BigDecimal.ZERO);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateOpenOrdersValue(Long customerId) {
        List<SalesOrder> openOrders = salesOrderRepository.findByCustomerIdAndStatusIn(
                customerId,
                List.of(OrderStatus.APPROVED, OrderStatus.PARTIALLY_SHIPPED)
        );

        BigDecimal total = BigDecimal.ZERO;
        for (SalesOrder order : openOrders) {
            if (order.getItems() != null) {
                for (var item : order.getItems()) {
                    int remaining = item.getRemainingQuantity();
                    if (remaining > 0) {
                        BigDecimal itemValue = item.getUnitPrice().multiply(BigDecimal.valueOf(remaining));
                        total = total.add(itemValue);
                    }
                }
            }
        }
        return total;
    }

    @Transactional(readOnly = true)
    public CreditAssessment assessOrderCredit(Customer customer, BigDecimal newOrderAmount) {
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;
        BigDecimal unpaidInvoices = calculateUnpaidInvoices(customer.getId());
        BigDecimal openOrders = calculateOpenOrdersValue(customer.getId());
        BigDecimal currentExposure = unpaidInvoices.add(openOrders);
        BigDecimal projectedExposure = currentExposure.add(newOrderAmount);

        // Problem statement rule:
        // "A new order must be put on hold if the customer's unpaid invoices plus open orders exceed the limit."
        // "Include one order that lands exactly on a customer's credit limit" -> projectedExposure == creditLimit is APPROVED.
        boolean exceeds = projectedExposure.compareTo(creditLimit) > 0;

        if (exceeds) {
            String reason = String.format(
                    "Credit limit exceeded. Limit: $%.2f, Projected Exposure: $%.2f (Unpaid Invoices: $%.2f, Open Orders: $%.2f, New Order: $%.2f).",
                    creditLimit, projectedExposure, unpaidInvoices, openOrders, newOrderAmount
            );
            BigDecimal available = creditLimit.subtract(projectedExposure);
            return new CreditAssessment(
                    false, creditLimit, unpaidInvoices, openOrders, currentExposure,
                    newOrderAmount, projectedExposure, available, reason
            );
        } else {
            BigDecimal available = creditLimit.subtract(projectedExposure).max(BigDecimal.ZERO);
            return new CreditAssessment(
                    true, creditLimit, unpaidInvoices, openOrders, currentExposure,
                    newOrderAmount, projectedExposure, available, "Credit check passed within limit."
            );
        }
    }
}

