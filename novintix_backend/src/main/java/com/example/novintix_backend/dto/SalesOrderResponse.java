package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.OrderStatus;
import com.example.novintix_backend.entity.SalesOrder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SalesOrderResponse(
        Long id,
        String orderNumber,
        Long customerId,
        String customerCode,
        String customerName,
        OrderStatus status,
        String holdReason,
        BigDecimal totalAmount,
        LocalDateTime orderDate,
        List<OrderItemResponse> items
) {
    public static SalesOrderResponse from(SalesOrder order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(OrderItemResponse::from).toList()
                : List.of();

        return new SalesOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomer().getId(),
                order.getCustomer().getCustomerCode(),
                order.getCustomer().getCompanyName(),
                order.getStatus(),
                order.getHoldReason(),
                order.getTotalAmount(),
                order.getOrderDate(),
                itemResponses
        );
    }
}

