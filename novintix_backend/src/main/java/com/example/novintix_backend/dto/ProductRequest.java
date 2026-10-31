package com.example.novintix_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(

        @NotBlank(message = "Product code is required")
        @Size(max = 30, message = "Product code cannot exceed 30 characters")
        String productCode,

        @NotBlank(message = "Product name is required")
        @Size(max = 120, message = "Product name cannot exceed 120 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @NotNull(message = "Standard price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than zero")
        BigDecimal standardPrice

) {
}
