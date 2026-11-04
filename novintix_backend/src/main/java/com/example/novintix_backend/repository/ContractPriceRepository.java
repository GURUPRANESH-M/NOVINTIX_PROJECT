package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.ContractPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractPriceRepository extends JpaRepository<ContractPrice, Long> {

    @Query("SELECT cp FROM ContractPrice cp JOIN FETCH cp.product p JOIN FETCH cp.customer c WHERE cp.customer.id = :customerId ORDER BY p.name ASC")
    List<ContractPrice> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    List<ContractPrice> findByCustomerId(Long customerId);

    Optional<ContractPrice> findByCustomerIdAndProductIdAndActiveTrue(Long customerId, Long productId);

    Optional<ContractPrice> findByCustomerIdAndProductId(Long customerId, Long productId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
}

