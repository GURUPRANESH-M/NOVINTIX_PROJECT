package com.example.novintix_backend.dto;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        long totalCustomers,
        long totalProducts,
        long totalOrders,
        long ordersOnHold,
        BigDecimal totalCreditExposure,
        BigDecimal totalUnpaidInvoices,
        long totalShipments
) {
}

