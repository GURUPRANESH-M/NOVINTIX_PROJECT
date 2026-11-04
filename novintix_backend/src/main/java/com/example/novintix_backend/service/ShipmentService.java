package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CreateShipmentRequest;
import com.example.novintix_backend.dto.ShipmentItemRequest;
import com.example.novintix_backend.dto.ShipmentResponse;
import com.example.novintix_backend.entity.*;
import com.example.novintix_backend.repository.OrderItemRepository;
import com.example.novintix_backend.repository.SalesOrderRepository;
import com.example.novintix_backend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InvoiceService invoiceService;

    public ShipmentService(
            ShipmentRepository shipmentRepository,
            SalesOrderRepository salesOrderRepository,
            OrderItemRepository orderItemRepository,
            InvoiceService invoiceService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.orderItemRepository = orderItemRepository;
        this.invoiceService = invoiceService;
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> getAllShipments() {
        return shipmentRepository.findAllWithDetails().stream()
                .map(s -> ShipmentResponse.from(s, null, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> getShipmentsByCustomer(Long customerId) {
        return shipmentRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(s -> ShipmentResponse.from(s, null, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> getShipmentsByOrder(Long orderId) {
        return shipmentRepository.findByOrderIdWithDetails(orderId).stream()
                .map(s -> ShipmentResponse.from(s, null, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentById(Long id) {
        Shipment shipment = shipmentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
        return ShipmentResponse.from(shipment, null, null);
    }

    /**
     * Problem statement rules:
     * "Shipments can be partial, so invoices must follow shipments.
     * Include one order that ships only partly."
     */
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        SalesOrder order = salesOrderRepository.findByIdWithDetails(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() != OrderStatus.APPROVED && order.getStatus() != OrderStatus.PARTIALLY_SHIPPED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot ship order with status: " + order.getStatus() + ". Only APPROVED or PARTIALLY_SHIPPED orders can be shipped."
            );
        }

        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setCustomer(order.getCustomer());
        shipment.setShipmentNumber(generateShipmentNumber());
        shipment.setShipmentDate(LocalDateTime.now());
        shipment.setCarrier(request.carrier() != null ? request.carrier() : "Standard Medical Logistics");
        shipment.setTrackingNumber(request.trackingNumber() != null ? request.trackingNumber() : "TRK-" + (System.currentTimeMillis() % 1000000));
        shipment.setNotes(request.notes());

        for (ShipmentItemRequest itemReq : request.items()) {
            OrderItem orderItem = order.getItems().stream()
                    .filter(i -> i.getId().equals(itemReq.orderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Order item not found in this order: " + itemReq.orderItemId()
                    ));

            int remaining = orderItem.getRemainingQuantity();
            if (itemReq.quantityShipped() > remaining) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot ship " + itemReq.quantityShipped() + " units of " +
                                orderItem.getProduct().getName() + ". Only " + remaining + " units remain unshipped."
                );
            }

            orderItem.setShippedQuantity(orderItem.getShippedQuantity() + itemReq.quantityShipped());
            orderItemRepository.save(orderItem);

            ShipmentItem shipmentItem = new ShipmentItem(orderItem, orderItem.getProduct(), itemReq.quantityShipped());
            shipment.addItem(shipmentItem);
        }

        // Check if all order items are completely fulfilled
        boolean allFulfilled = order.getItems().stream().allMatch(i -> i.getRemainingQuantity() == 0);
        if (allFulfilled) {
            order.setStatus(OrderStatus.FULFILLED);
        } else {
            order.setStatus(OrderStatus.PARTIALLY_SHIPPED);
        }
        salesOrderRepository.save(order);

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Problem statement rule: "invoices must follow shipments. In simple words: invoice only what was shipped"
        Invoice invoice = invoiceService.createInvoiceForShipment(savedShipment);

        return ShipmentResponse.from(savedShipment, invoice.getId(), invoice.getInvoiceNumber());
    }

    private synchronized String generateShipmentNumber() {
        return "SHP-" + (System.currentTimeMillis() % 1000000);
    }
}

