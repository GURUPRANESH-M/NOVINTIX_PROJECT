package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.ContractPriceRequest;
import com.example.novintix_backend.dto.ContractPriceResponse;
import com.example.novintix_backend.dto.CustomerPricingMatrixItem;
import com.example.novintix_backend.entity.ContractPrice;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.entity.Product;
import com.example.novintix_backend.repository.ContractPriceRepository;
import com.example.novintix_backend.repository.CustomerRepository;
import com.example.novintix_backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ContractPriceService {

    private final ContractPriceRepository contractPriceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public ContractPriceService(
            ContractPriceRepository contractPriceRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository
    ) {
        this.contractPriceRepository = contractPriceRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ContractPriceResponse> getContractPricesByCustomer(Long customerId) {
        return contractPriceRepository.findByCustomerIdWithDetails(customerId).stream()
                .map(ContractPriceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPricingMatrixItem> getCustomerPricingMatrix(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        List<Product> products = productRepository.findAll();
        List<ContractPrice> contracts = contractPriceRepository.findByCustomerId(customerId);

        Map<Long, ContractPrice> contractMap = contracts.stream()
                .filter(ContractPrice::isActive)
                .collect(Collectors.toMap(c -> c.getProduct().getId(), Function.identity(), (a, b) -> a));

        List<CustomerPricingMatrixItem> matrix = new ArrayList<>();

        for (Product product : products) {
            ContractPrice contract = contractMap.get(product.getId());
            BigDecimal standard = product.getStandardPrice();

            if (contract != null && contract.getContractPrice() != null) {
                BigDecimal negotiated = contract.getContractPrice();
                BigDecimal discount = BigDecimal.ZERO;
                if (standard != null && standard.compareTo(BigDecimal.ZERO) > 0) {
                    discount = standard.subtract(negotiated)
                            .multiply(BigDecimal.valueOf(100))
                            .divide(standard, 1, RoundingMode.HALF_UP);
                }

                matrix.add(new CustomerPricingMatrixItem(
                        product.getId(),
                        product.getProductCode(),
                        product.getName(),
                        standard,
                        contract.getId(),
                        negotiated,
                        discount,
                        true
                ));
            } else {
                matrix.add(new CustomerPricingMatrixItem(
                        product.getId(),
                        product.getProductCode(),
                        product.getName(),
                        standard,
                        null,
                        null,
                        BigDecimal.ZERO,
                        false
                ));
            }
        }

        return matrix;
    }

    @Transactional
    public ContractPriceResponse saveContractPrice(ContractPriceRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        ContractPrice contractPrice = contractPriceRepository
                .findByCustomerIdAndProductId(request.customerId(), request.productId())
                .orElseGet(() -> new ContractPrice(customer, product, request.contractPrice()));

        contractPrice.setContractPrice(request.contractPrice());
        contractPrice.setActive(true);

        return ContractPriceResponse.from(contractPriceRepository.save(contractPrice));
    }

    @Transactional
    public void deleteContractPrice(Long id) {
        if (!contractPriceRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract price not found");
        }
        contractPriceRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public BigDecimal resolvePrice(Customer customer, Product product) {
        return contractPriceRepository
                .findByCustomerIdAndProductIdAndActiveTrue(customer.getId(), product.getId())
                .map(ContractPrice::getContractPrice)
                .orElse(product.getStandardPrice());
    }
}
