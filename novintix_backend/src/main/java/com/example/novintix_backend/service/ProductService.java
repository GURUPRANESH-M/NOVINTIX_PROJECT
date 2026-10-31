package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.ProductRequest;
import com.example.novintix_backend.dto.ProductResponse;
import com.example.novintix_backend.entity.Product;
import com.example.novintix_backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAll(String search) {

        List<Product> products;

        if (search == null || search.isBlank()) {
            products = productRepository.findAll();
        } else {
            String keyword = search.trim();

            products =
                    productRepository
                            .findByNameContainingIgnoreCaseOrProductCodeContainingIgnoreCase(
                                    keyword,
                                    keyword
                            );
        }

        return products.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {

        String code = normalizeCode(request.productCode());

        if (productRepository.existsByProductCodeIgnoreCase(code)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A product with this code already exists"
            );
        }

        Product product = new Product();

        product.setProductCode(code);
        product.setName(request.name().trim());
        product.setDescription(normalizeDescription(request.description()));
        product.setStandardPrice(request.standardPrice());
        product.setActive(true);

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {

        Product product = findProduct(id);

        String code = normalizeCode(request.productCode());

        productRepository.findByProductCodeIgnoreCase(code)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Another product already uses this code"
                    );
                });

        product.setProductCode(code);
        product.setName(request.name().trim());
        product.setDescription(normalizeDescription(request.description()));
        product.setStandardPrice(request.standardPrice());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse deactivate(Long id) {

        Product product = findProduct(id);
        product.setActive(false);

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse activate(Long id) {

        Product product = findProduct(id);
        product.setActive(true);

        return toResponse(productRepository.save(product));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                ));
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }

        return description.trim();
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getProductCode(),
                product.getName(),
                product.getDescription(),
                product.getStandardPrice(),
                product.isActive(),
                product.getCreatedAt()
        );
    }
}
