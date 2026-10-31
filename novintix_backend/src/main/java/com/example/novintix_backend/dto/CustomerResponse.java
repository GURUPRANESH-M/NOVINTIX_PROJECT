package com.example.novintix_backend.dto;


import com.example.novintix_backend.entity.Customer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String customerCode,
        String companyName,
        Customer.CustomerType customerType,
        String contactPerson,
        String email,
        String phone,
        String billingAddress,
        String shippingAddress,
        BigDecimal creditLimit,
        Integer paymentTermsDays,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCompanyName(),
                customer.getCustomerType(),
                customer.getContactPerson(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getBillingAddress(),
                customer.getShippingAddress(),
                customer.getCreditLimit(),
                customer.getPaymentTermsDays(),
                customer.isActive(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}