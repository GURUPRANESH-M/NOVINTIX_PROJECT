package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.Invoice;
import com.example.novintix_backend.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("SELECT DISTINCT inv FROM Invoice inv " +
           "JOIN FETCH inv.customer c " +
           "JOIN FETCH inv.order o " +
           "LEFT JOIN FETCH inv.shipment s " +
           "LEFT JOIN FETCH inv.items i " +
           "LEFT JOIN FETCH i.product p " +
           "ORDER BY inv.invoiceDate DESC")
    List<Invoice> findAllWithDetails();

    @Query("SELECT DISTINCT inv FROM Invoice inv " +
           "JOIN FETCH inv.customer c " +
           "JOIN FETCH inv.order o " +
           "LEFT JOIN FETCH inv.shipment s " +
           "LEFT JOIN FETCH inv.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE inv.customer.id = :customerId " +
           "ORDER BY inv.invoiceDate DESC")
    List<Invoice> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT inv FROM Invoice inv " +
           "JOIN FETCH inv.customer c " +
           "JOIN FETCH inv.order o " +
           "LEFT JOIN FETCH inv.shipment s " +
           "LEFT JOIN FETCH inv.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE inv.id = :id")
    Optional<Invoice> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT inv FROM Invoice inv " +
           "WHERE inv.customer.id = :customerId AND inv.status IN (:statuses)")
    List<Invoice> findByCustomerIdAndStatusIn(
            @Param("customerId") Long customerId,
            @Param("statuses") List<InvoiceStatus> statuses
    );

    boolean existsByInvoiceNumber(String invoiceNumber);

    long countByStatus(InvoiceStatus status);
}

