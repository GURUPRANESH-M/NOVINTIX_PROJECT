package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.OrderStatus;
import com.example.novintix_backend.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    @Query("SELECT DISTINCT o FROM SalesOrder o " +
           "JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "ORDER BY o.orderDate DESC")
    List<SalesOrder> findAllWithDetails();

    @Query("SELECT DISTINCT o FROM SalesOrder o " +
           "JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.customer.id = :customerId " +
           "ORDER BY o.orderDate DESC")
    List<SalesOrder> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT o FROM SalesOrder o " +
           "JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.id = :id")
    Optional<SalesOrder> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM SalesOrder o " +
           "JOIN FETCH o.items i " +
           "WHERE o.customer.id = :customerId AND o.status IN (:statuses)")
    List<SalesOrder> findByCustomerIdAndStatusIn(
            @Param("customerId") Long customerId,
            @Param("statuses") List<OrderStatus> statuses
    );

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    long countByStatus(OrderStatus status);
}

