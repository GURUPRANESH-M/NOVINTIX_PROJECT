package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.DashboardStatsResponse;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.InvoiceStatus;
import com.example.novintix_backend.entity.OrderStatus;
import com.example.novintix_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ShipmentRepository shipmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CreditRiskService creditRiskService;

    public DashboardService(
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            SalesOrderRepository salesOrderRepository,
            ShipmentRepository shipmentRepository,
            InvoiceRepository invoiceRepository,
            CreditRiskService creditRiskService
    ) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.shipmentRepository = shipmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.creditRiskService = creditRiskService;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalCustomers = customerRepository.count();
        long totalProducts = productRepository.count();
        long totalOrders = salesOrderRepository.count();
        long ordersOnHold = salesOrderRepository.countByStatus(OrderStatus.ON_HOLD);
        long totalShipments = shipmentRepository.count();

        List<Customer> customers = customerRepository.findAll();
        BigDecimal totalExposure = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;

        for (Customer c : customers) {
            BigDecimal unpaid = creditRiskService.calculateUnpaidInvoices(c.getId());
            BigDecimal open = creditRiskService.calculateOpenOrdersValue(c.getId());
            totalUnpaid = totalUnpaid.add(unpaid);
            totalExposure = totalExposure.add(unpaid).add(open);
        }

        return new DashboardStatsResponse(
                totalCustomers,
                totalProducts,
                totalOrders,
                ordersOnHold,
                totalExposure,
                totalUnpaid,
                totalShipments
        );
    }
}

