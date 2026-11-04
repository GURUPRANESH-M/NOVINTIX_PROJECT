package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.CreateCreditNoteRequest;
import com.example.novintix_backend.dto.CreditNoteResponse;
import com.example.novintix_backend.service.CreditNoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credit-notes")
public class CreditNoteController {

    private final CreditNoteService creditNoteService;

    public CreditNoteController(CreditNoteService creditNoteService) {
        this.creditNoteService = creditNoteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditNoteResponse createCreditNote(@Valid @RequestBody CreateCreditNoteRequest request) {
        return creditNoteService.createCreditNote(request);
    }

    @GetMapping
    public List<CreditNoteResponse> getAllCreditNotes(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return creditNoteService.getCreditNotesByCustomer(customerId);
        }
        return creditNoteService.getAllCreditNotes();
    }

    @GetMapping("/{id}")
    public CreditNoteResponse getCreditNoteById(@PathVariable Long id) {
        return creditNoteService.getCreditNoteById(id);
    }
}

