package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByCustomerCodeIgnoreCase(String customerCode);

    boolean existsByCustomerCodeIgnoreCaseAndIdNot(
            String customerCode,
            Long id
    );

    List<Customer> findAllByOrderByCreatedAtDesc();

    List<Customer> findByCompanyNameContainingIgnoreCaseOrCustomerCodeContainingIgnoreCase(
            String companyName,
            String customerCode
    );
}
