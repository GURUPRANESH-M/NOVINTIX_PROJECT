package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CreateOrderRequest;
import com.example.novintix_backend.dto.OrderItemRequest;
import com.example.novintix_backend.dto.SalesOrderResponse;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.OrderItem;
import com.example.novintix_backend.entity.OrderStatus;
import com.example.novintix_backend.entity.Product;
import com.example.novintix_backend.entity.SalesOrder;
import com.example.novintix_backend.repository.CustomerRepository;
import com.example.novintix_backend.repository.ProductRepository;
import com.example.novintix_backend.repository.SalesOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ContractPriceService contractPriceService;
    private final CreditRiskService creditRiskService;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            ContractPriceService contractPriceService,
            CreditRiskService creditRiskService
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.contractPriceService = contractPriceService;
        this.creditRiskService = creditRiskService;
    }

    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getAllOrders() {
        return salesOrderRepository.findAllWithDetails().stream()
                .map(SalesOrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getOrdersByCustomer(Long customerId) {
        return salesOrderRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(SalesOrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SalesOrderResponse getOrderById(Long id) {
        return SalesOrderResponse.from(findOrder(id));
    }

    @Transactional
    public SalesOrderResponse createOrder(CreateOrderRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!customer.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot place order for an inactive customer");
        }

        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.now());
        order.setOrderNumber(generateOrderNumber());

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product not found: " + itemReq.productId()
                    ));

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Product " + product.getName() + " is inactive"
                );
            }

            // Rule: "A new order must be priced from the right contract"
            BigDecimal unitPrice = contractPriceService.resolvePrice(customer, product);

            OrderItem item = new OrderItem(product, itemReq.quantity(), unitPrice);
            totalAmount = totalAmount.add(item.getSubtotal());
            order.addItem(item);
        }

        order.setTotalAmount(totalAmount);

        // Rule: Credit Risk Engine assessment
        var assessment = creditRiskService.assessOrderCredit(customer, totalAmount);

        if (assessment.approved()) {
            order.setStatus(OrderStatus.APPROVED);
            order.setHoldReason(null);
        } else {
            order.setStatus(OrderStatus.ON_HOLD);
            order.setHoldReason(assessment.reason());
        }

        SalesOrder savedOrder = salesOrderRepository.save(order);
        return SalesOrderResponse.from(savedOrder);
    }

    @Transactional
    public SalesOrderResponse releaseHold(Long id) {
        SalesOrder order = findOrder(id);
        if (order.getStatus() != OrderStatus.ON_HOLD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only orders ON_HOLD can be released");
        }
        order.setStatus(OrderStatus.APPROVED);
        order.setHoldReason("Hold manually released by administrator approval");
        return SalesOrderResponse.from(salesOrderRepository.save(order));
    }

    @Transactional
    public SalesOrderResponse cancelOrder(Long id) {
        SalesOrder order = findOrder(id);
        if (order.getStatus() == OrderStatus.FULFILLED || order.getStatus() == OrderStatus.PARTIALLY_SHIPPED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel an order that has already shipped");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return SalesOrderResponse.from(salesOrderRepository.save(order));
    }

    public SalesOrder findOrder(Long id) {
        return salesOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private synchronized String generateOrderNumber() {
        return "SO-" + System.currentTimeMillis() % 1000000;
    }
}

