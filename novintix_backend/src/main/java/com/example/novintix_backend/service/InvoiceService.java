package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.InvoiceResponse;
import com.example.novintix_backend.entity.*;
import com.example.novintix_backend.repository.InvoiceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAllWithDetails().stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByCustomer(Long customerId) {
        return invoiceRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        return InvoiceResponse.from(findInvoice(id));
    }

    /**
     * Problem statement rule:
     * "Shipments can be partial, so invoices must follow shipments.
     * In simple words: invoice only what was shipped, and keep the money trail clear."
     */
    @Transactional
    public Invoice createInvoiceForShipment(Shipment shipment) {
        Customer customer = shipment.getCustomer();
        SalesOrder order = shipment.getOrder();

        Invoice invoice = new Invoice();
        invoice.setCustomer(customer);
        invoice.setOrder(order);
        invoice.setShipment(shipment);
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setInvoiceDate(LocalDateTime.now());

        int terms = (customer.getPaymentTermsDays() != null) ? customer.getPaymentTermsDays() : 30;
        invoice.setDueDate(LocalDate.now().plusDays(terms));
        invoice.setStatus(InvoiceStatus.UNPAID);
        invoice.setPaidAmount(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;

        for (ShipmentItem shipmentItem : shipment.getItems()) {
            Product product = shipmentItem.getProduct();
            int shippedQty = shipmentItem.getQuantityShipped();
            BigDecimal unitPrice = shipmentItem.getOrderItem().getUnitPrice();

            InvoiceItem invoiceItem = new InvoiceItem(product, shippedQty, unitPrice);
            total = total.add(invoiceItem.getSubtotal());
            invoice.addItem(invoiceItem);
        }

        invoice.setTotalAmount(total);
        return invoiceRepository.save(invoice);
    }

    public Invoice findInvoice(Long id) {
        return invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));
    }

    private synchronized String generateInvoiceNumber() {
        return "INV-" + (System.currentTimeMillis() % 1000000);
    }
}

