package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.Shipment;
import java.time.LocalDateTime;
import java.util.List;

public record ShipmentResponse(
        Long id,
        String shipmentNumber,
        Long orderId,
        String orderNumber,
        Long customerId,
        String customerName,
        LocalDateTime shipmentDate,
        String carrier,
        String trackingNumber,
        String notes,
        List<ShipmentItemResponse> items,
        Long invoiceId,
        String invoiceNumber
) {
    public static ShipmentResponse from(Shipment shipment, Long invoiceId, String invoiceNumber) {
        List<ShipmentItemResponse> itemResponses = shipment.getItems() != null
                ? shipment.getItems().stream().map(ShipmentItemResponse::from).toList()
                : List.of();

        return new ShipmentResponse(
                shipment.getId(),
                shipment.getShipmentNumber(),
                shipment.getOrder().getId(),
                shipment.getOrder().getOrderNumber(),
                shipment.getCustomer().getId(),
                shipment.getCustomer().getCompanyName(),
                shipment.getShipmentDate(),
                shipment.getCarrier(),
                shipment.getTrackingNumber(),
                shipment.getNotes(),
                itemResponses,
                invoiceId,
                invoiceNumber
        );
    }
}

