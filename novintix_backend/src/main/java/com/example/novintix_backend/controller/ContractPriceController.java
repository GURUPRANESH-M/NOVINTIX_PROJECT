package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.ContractPriceRequest;
import com.example.novintix_backend.dto.ContractPriceResponse;
import com.example.novintix_backend.dto.CustomerPricingMatrixItem;
import com.example.novintix_backend.service.ContractPriceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractPriceController {

    private final ContractPriceService contractPriceService;

    public ContractPriceController(ContractPriceService contractPriceService) {
        this.contractPriceService = contractPriceService;
    }

    @GetMapping("/customer/{customerId}")
    public List<ContractPriceResponse> getCustomerContracts(@PathVariable Long customerId) {
        return contractPriceService.getContractPricesByCustomer(customerId);
    }

    @GetMapping("/customer/{customerId}/matrix")
    public List<CustomerPricingMatrixItem> getCustomerPricingMatrix(@PathVariable Long customerId) {
        return contractPriceService.getCustomerPricingMatrix(customerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContractPriceResponse saveContractPrice(@Valid @RequestBody ContractPriceRequest request) {
        return contractPriceService.saveContractPrice(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContractPrice(@PathVariable Long id) {
        contractPriceService.deleteContractPrice(id);
    }
}
