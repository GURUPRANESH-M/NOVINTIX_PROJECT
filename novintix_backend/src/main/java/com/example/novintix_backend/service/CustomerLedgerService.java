package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CustomerLedgerResponse;
import com.example.novintix_backend.dto.LedgerEntryDto;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.Invoice;
import com.example.novintix_backend.entity.Payment;
import com.example.novintix_backend.entity.CreditNote;
import com.example.novintix_backend.repository.CreditNoteRepository;
import com.example.novintix_backend.repository.CustomerRepository;
import com.example.novintix_backend.repository.InvoiceRepository;
import com.example.novintix_backend.repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CustomerLedgerService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final CreditRiskService creditRiskService;

    public CustomerLedgerService(
            CustomerRepository customerRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            CreditNoteRepository creditNoteRepository,
            CreditRiskService creditRiskService
    ) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.creditNoteRepository = creditNoteRepository;
        this.creditRiskService = creditRiskService;
    }

    private record RawEntry(
            LocalDateTime date,
            String type,
            String ref,
            String description,
            BigDecimal debit,
            BigDecimal credit
    ) {}

    @Transactional(readOnly = true)
    public CustomerLedgerResponse getCustomerLedger(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        List<Invoice> invoices = invoiceRepository.findByCustomerIdWithDetails(customerId);
        List<Payment> payments = paymentRepository.findByCustomerIdWithDetails(customerId);
        List<CreditNote> creditNotes = creditNoteRepository.findByCustomerIdWithDetails(customerId);

        List<RawEntry> rawEntries = new ArrayList<>();

        BigDecimal totalInvoiced = BigDecimal.ZERO;
        for (Invoice inv : invoices) {
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            totalInvoiced = totalInvoiced.add(amt);
            rawEntries.add(new RawEntry(
                    inv.getInvoiceDate(),
                    "INVOICE",
                    inv.getInvoiceNumber(),
                    "Invoice for " + (inv.getShipment() != null ? inv.getShipment().getShipmentNumber() : "Order " + inv.getOrder().getOrderNumber()),
                    amt,
                    BigDecimal.ZERO
            ));
        }

        BigDecimal totalPayments = BigDecimal.ZERO;
        for (Payment pay : payments) {
            BigDecimal amt = pay.getAmount() != null ? pay.getAmount() : BigDecimal.ZERO;
            totalPayments = totalPayments.add(amt);
            rawEntries.add(new RawEntry(
                    pay.getPaymentDate(),
                    "PAYMENT",
                    pay.getPaymentNumber(),
                    "Payment via " + pay.getPaymentMethod() + (pay.getInvoice() != null ? " against " + pay.getInvoice().getInvoiceNumber() : ""),
                    BigDecimal.ZERO,
                    amt
            ));
        }

        BigDecimal totalCreditNotes = BigDecimal.ZERO;
        for (CreditNote cn : creditNotes) {
            BigDecimal amt = cn.getTotalAmount() != null ? cn.getTotalAmount() : BigDecimal.ZERO;
            totalCreditNotes = totalCreditNotes.add(amt);
            rawEntries.add(new RawEntry(
                    cn.getIssueDate(),
                    "CREDIT_NOTE",
                    cn.getCreditNoteNumber(),
                    "Credit Note: " + cn.getReason(),
                    BigDecimal.ZERO,
                    amt
            ));
        }

        // Sort chronologically ascending
        rawEntries.sort(Comparator.comparing(RawEntry::date));

        // Compute running balance
        List<LedgerEntryDto> entries = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;

        for (RawEntry raw : rawEntries) {
            runningBalance = runningBalance.add(raw.debit()).subtract(raw.credit());
            entries.add(new LedgerEntryDto(
                    raw.date(),
                    raw.type(),
                    raw.ref(),
                    raw.description(),
                    raw.debit(),
                    raw.credit(),
                    runningBalance
            ));
        }

        BigDecimal unpaidBalance = totalInvoiced.subtract(totalPayments).subtract(totalCreditNotes).max(BigDecimal.ZERO);
        BigDecimal openOrdersValue = creditRiskService.calculateOpenOrdersValue(customerId);
        BigDecimal totalExposure = unpaidBalance.add(openOrdersValue);
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : BigDecimal.ZERO;
        BigDecimal availableCredit = creditLimit.subtract(totalExposure);

        return new CustomerLedgerResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCompanyName(),
                customer.getCustomerType().name(),
                creditLimit,
                totalInvoiced,
                totalPayments,
                totalCreditNotes,
                unpaidBalance,
                openOrdersValue,
                totalExposure,
                availableCredit,
                entries
        );
    }
}

