package com.example.novintix_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String productCode,
        String name,
        String description,
        BigDecimal standardPrice,
        boolean active,
        LocalDateTime createdAt
) {
}
