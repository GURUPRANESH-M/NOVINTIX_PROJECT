package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CreateCreditNoteRequest;
import com.example.novintix_backend.dto.CreditNoteItemRequest;
import com.example.novintix_backend.dto.CreditNoteResponse;
import com.example.novintix_backend.entity.*;
import com.example.novintix_backend.repository.CreditNoteRepository;
import com.example.novintix_backend.repository.CustomerRepository;
import com.example.novintix_backend.repository.InvoiceRepository;
import com.example.novintix_backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CreditNoteService {

    private final CreditNoteRepository creditNoteRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;

    public CreditNoteService(
            CreditNoteRepository creditNoteRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.creditNoteRepository = creditNoteRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditNoteResponse> getAllCreditNotes() {
        return creditNoteRepository.findAllWithDetails().stream()
                .map(CreditNoteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CreditNoteResponse> getCreditNotesByCustomer(Long customerId) {
        return creditNoteRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(CreditNoteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CreditNoteResponse getCreditNoteById(Long id) {
        CreditNote cn = creditNoteRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Credit note not found"));
        return CreditNoteResponse.from(cn);
    }

    /**
     * Problem statement rule:
     * "Damaged or near-expiry goods come back and need credit notes."
     */
    @Transactional
    public CreditNoteResponse createCreditNote(CreateCreditNoteRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId()).orElse(null);
        }

        CreditNote creditNote = new CreditNote();
        creditNote.setCustomer(customer);
        creditNote.setInvoice(invoice);
        creditNote.setCreditNoteNumber(generateCreditNoteNumber());
        creditNote.setReason(request.reason());
        creditNote.setIssueDate(LocalDateTime.now());

        BigDecimal total = BigDecimal.ZERO;

        for (CreditNoteItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product not found: " + itemReq.productId()
                    ));

            CreditNoteItem item = new CreditNoteItem(
                    product,
                    itemReq.quantity(),
                    itemReq.unitPrice(),
                    itemReq.conditionReason()
            );
            total = total.add(item.getSubtotal());
            creditNote.addItem(item);
        }

        creditNote.setTotalAmount(total);

        CreditNote saved = creditNoteRepository.save(creditNote);
        return CreditNoteResponse.from(saved);
    }

    private synchronized String generateCreditNoteNumber() {
        return "CN-" + (System.currentTimeMillis() % 1000000);
    }
}

