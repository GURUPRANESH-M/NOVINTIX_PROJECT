package com.example.novintix_backend.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserInfo user
) {

    public record UserInfo(
            Long id,
            String email,
            String role
    ) {}
}
