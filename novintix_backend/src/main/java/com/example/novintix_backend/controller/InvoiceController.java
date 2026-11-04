package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.InvoiceResponse;
import com.example.novintix_backend.service.InvoiceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<InvoiceResponse> getAllInvoices(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return invoiceService.getInvoicesByCustomer(customerId);
        }
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }
}

