package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.customer c " +
           "LEFT JOIN FETCH p.invoice inv " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findAllWithDetails();

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.customer c " +
           "LEFT JOIN FETCH p.invoice inv " +
           "WHERE p.customer.id = :customerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.customer c " +
           "LEFT JOIN FETCH p.invoice inv " +
           "WHERE p.id = :id")
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);

    boolean existsByPaymentNumber(String paymentNumber);
}

