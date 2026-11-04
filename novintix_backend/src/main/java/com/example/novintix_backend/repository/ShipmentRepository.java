package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    @Query("SELECT DISTINCT s FROM Shipment s " +
           "JOIN FETCH s.order o " +
           "JOIN FETCH s.customer c " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product p " +
           "ORDER BY s.shipmentDate DESC")
    List<Shipment> findAllWithDetails();

    @Query("SELECT DISTINCT s FROM Shipment s " +
           "JOIN FETCH s.order o " +
           "JOIN FETCH s.customer c " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE s.customer.id = :customerId " +
           "ORDER BY s.shipmentDate DESC")
    List<Shipment> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT s FROM Shipment s " +
           "JOIN FETCH s.order o " +
           "JOIN FETCH s.customer c " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE s.order.id = :orderId " +
           "ORDER BY s.shipmentDate DESC")
    List<Shipment> findByOrderIdWithDetails(@Param("orderId") Long orderId);

    @Query("SELECT DISTINCT s FROM Shipment s " +
           "JOIN FETCH s.order o " +
           "JOIN FETCH s.customer c " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE s.id = :id")
    Optional<Shipment> findByIdWithDetails(@Param("id") Long id);

    boolean existsByShipmentNumber(String shipmentNumber);
}

