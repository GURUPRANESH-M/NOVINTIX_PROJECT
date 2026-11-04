package com.example.novintix_backend.dto;

import com.example.novintix_backend.entity.ContractPrice;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractPriceResponse(
        Long id,
        Long customerId,
        String customerName,
        Long productId,
        String productCode,
        String productName,
        BigDecimal contractPrice,
        BigDecimal standardPrice,
        LocalDate effectiveFrom,
        boolean active
) {
    public static ContractPriceResponse from(ContractPrice cp) {
        return new ContractPriceResponse(
                cp.getId(),
                cp.getCustomer().getId(),
                cp.getCustomer().getCompanyName(),
                cp.getProduct().getId(),
                cp.getProduct().getProductCode(),
                cp.getProduct().getName(),
                cp.getContractPrice(),
                cp.getProduct().getStandardPrice(),
                cp.getEffectiveFrom(),
                cp.isActive()
        );
    }
}

