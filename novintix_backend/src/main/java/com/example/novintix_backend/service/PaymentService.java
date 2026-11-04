package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CreatePaymentRequest;
import com.example.novintix_backend.dto.PaymentResponse;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.Invoice;
import com.example.novintix_backend.entity.InvoiceStatus;
import com.example.novintix_backend.entity.Payment;
import com.example.novintix_backend.repository.CustomerRepository;
import com.example.novintix_backend.repository.InvoiceRepository;
import com.example.novintix_backend.repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            CustomerRepository customerRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllWithDetails().stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByCustomer(Long customerId) {
        return paymentRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment p = paymentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return PaymentResponse.from(p);
    }

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceRepository.findById(request.invoiceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));

            if (!invoice.getCustomer().getId().equals(customer.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice does not belong to this customer");
            }

            BigDecimal currentPaid = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal updatedPaid = currentPaid.add(request.amount());
            invoice.setPaidAmount(updatedPaid);

            if (updatedPaid.compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else {
                invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            }
            invoiceRepository.save(invoice);
        }

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setInvoice(invoice);
        payment.setPaymentNumber(generatePaymentNumber());
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setReferenceNumber(request.referenceNumber());
        payment.setNotes(request.notes());
        payment.setPaymentDate(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        return PaymentResponse.from(saved);
    }

    private synchronized String generatePaymentNumber() {
        return "PAY-" + (System.currentTimeMillis() % 1000000);
    }
}

