package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.CustomerLedgerResponse;
import com.example.novintix_backend.service.CustomerLedgerService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ledger")
public class CustomerLedgerController {

    private final CustomerLedgerService customerLedgerService;

    public CustomerLedgerController(CustomerLedgerService customerLedgerService) {
        this.customerLedgerService = customerLedgerService;
    }

    @GetMapping("/customer/{customerId}")
    public CustomerLedgerResponse getLedger(@PathVariable Long customerId) {
        return customerLedgerService.getCustomerLedger(customerId);
    }
}

