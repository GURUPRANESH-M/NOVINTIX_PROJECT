package com.example.novintix_backend.controller;

import com.example.novintix_backend.dto.LoginRequest;
import com.example.novintix_backend.dto.LoginResponse;
import com.example.novintix_backend.service.AuthService;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }
}
