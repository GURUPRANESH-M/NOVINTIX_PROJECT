package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.CreateOrderRequest;
import com.example.novintix_backend.dto.SalesOrderResponse;
import com.example.novintix_backend.service.SalesOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalesOrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return salesOrderService.createOrder(request);
    }

    @GetMapping
    public List<SalesOrderResponse> getAllOrders(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return salesOrderService.getOrdersByCustomer(customerId);
        }
        return salesOrderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public SalesOrderResponse getOrderById(@PathVariable Long id) {
        return salesOrderService.getOrderById(id);
    }

    @PatchMapping("/{id}/release-hold")
    public SalesOrderResponse releaseHold(@PathVariable Long id) {
        return salesOrderService.releaseHold(id);
    }

    @PatchMapping("/{id}/cancel")
    public SalesOrderResponse cancelOrder(@PathVariable Long id) {
        return salesOrderService.cancelOrder(id);
    }
}

