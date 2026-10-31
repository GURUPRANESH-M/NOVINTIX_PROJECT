package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.Customer;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CustomerRequest(

        @NotBlank(message = "Customer code is required")
        @Size(max = 30, message = "Customer code cannot exceed 30 characters")
        String customerCode,

        @NotBlank(message = "Company name is required")
        @Size(max = 150, message = "Company name cannot exceed 150 characters")
        String companyName,

        @NotNull(message = "Customer type is required")
        Customer.CustomerType customerType,

        @NotBlank(message = "Contact person is required")
        @Size(max = 100)
        String contactPerson,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150)
        String email,

        @NotBlank(message = "Phone number is required")
        @Pattern(
                regexp = "^[0-9+() -]{7,20}$",
                message = "Enter a valid phone number"
        )
        String phone,

        @NotBlank(message = "Billing address is required")
        @Size(max = 500)
        String billingAddress,

        @NotBlank(message = "Shipping address is required")
        @Size(max = 500)
        String shippingAddress,

        @NotNull(message = "Credit limit is required")
        @DecimalMin(value = "0.00", message = "Credit limit cannot be negative")
        @Digits(integer = 13, fraction = 2)
        BigDecimal creditLimit,

        @NotNull(message = "Payment terms are required")
        @Min(value = 0, message = "Payment terms cannot be negative")
        @Max(value = 365, message = "Payment terms cannot exceed 365 days")
        Integer paymentTermsDays
) {
}
