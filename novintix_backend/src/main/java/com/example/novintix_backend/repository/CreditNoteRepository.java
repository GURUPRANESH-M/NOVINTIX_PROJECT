package com.example.novintix_backend.repository;

import com.example.novintix_backend.entity.CreditNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNote, Long> {

    @Query("SELECT DISTINCT cn FROM CreditNote cn " +
           "JOIN FETCH cn.customer c " +
           "LEFT JOIN FETCH cn.invoice inv " +
           "LEFT JOIN FETCH cn.items i " +
           "LEFT JOIN FETCH i.product p " +
           "ORDER BY cn.issueDate DESC")
    List<CreditNote> findAllWithDetails();

    @Query("SELECT DISTINCT cn FROM CreditNote cn " +
           "JOIN FETCH cn.customer c " +
           "LEFT JOIN FETCH cn.invoice inv " +
           "LEFT JOIN FETCH cn.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE cn.customer.id = :customerId " +
           "ORDER BY cn.issueDate DESC")
    List<CreditNote> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT cn FROM CreditNote cn " +
           "JOIN FETCH cn.customer c " +
           "LEFT JOIN FETCH cn.invoice inv " +
           "LEFT JOIN FETCH cn.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE cn.id = :id")
    Optional<CreditNote> findByIdWithDetails(@Param("id") Long id);

    boolean existsByCreditNoteNumber(String creditNoteNumber);
}

