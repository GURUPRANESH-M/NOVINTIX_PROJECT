package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.CreatePaymentRequest;
import com.example.novintix_backend.dto.PaymentResponse;
import com.example.novintix_backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @GetMapping
    public List<PaymentResponse> getAllPayments(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return paymentService.getPaymentsByCustomer(customerId);
        }
        return paymentService.getAllPayments();
    }

    @GetMapping("/{id}")
    public PaymentResponse getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id);
    }
}

