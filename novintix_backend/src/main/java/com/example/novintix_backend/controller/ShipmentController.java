package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.CreateShipmentRequest;
import com.example.novintix_backend.dto.ShipmentResponse;
import com.example.novintix_backend.service.ShipmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentResponse createShipment(@Valid @RequestBody CreateShipmentRequest request) {
        return shipmentService.createShipment(request);
    }

    @GetMapping
    public List<ShipmentResponse> getAllShipments(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long orderId
    ) {
        if (customerId != null) {
            return shipmentService.getShipmentsByCustomer(customerId);
        }
        if (orderId != null) {
            return shipmentService.getShipmentsByOrder(orderId);
        }
        return shipmentService.getAllShipments();
    }

    @GetMapping("/{id}")
    public ShipmentResponse getShipmentById(@PathVariable Long id) {
        return shipmentService.getShipmentById(id);
    }
}

