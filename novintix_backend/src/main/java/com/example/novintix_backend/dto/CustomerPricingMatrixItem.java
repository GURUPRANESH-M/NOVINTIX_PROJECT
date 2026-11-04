package com.example.novintix_backend.dto;

import java.math.BigDecimal;

public record CustomerPricingMatrixItem(
        Long productId,
        String productCode,
        String productName,
        BigDecimal standardPrice,
        Long contractPriceId,
        BigDecimal negotiatedPrice,
        BigDecimal discountPercentage,
        boolean hasSpecialPrice
) {
}

