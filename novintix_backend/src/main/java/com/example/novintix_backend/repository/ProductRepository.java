package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByProductCodeIgnoreCase(String productCode);

    Optional<Product> findByProductCodeIgnoreCase(String productCode);

    List<Product> findByNameContainingIgnoreCaseOrProductCodeContainingIgnoreCase(
            String name,
            String productCode
    );
}
