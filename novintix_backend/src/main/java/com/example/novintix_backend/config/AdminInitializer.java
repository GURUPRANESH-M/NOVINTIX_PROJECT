package com.example.novintix_backend.config;


import com.example.novintix_backend.entity.AppUser;
import com.example.novintix_backend.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initializeAdmin(
            AppUserRepository repository,
            PasswordEncoder passwordEncoder,

            @Value("${app.admin.email}")
            String adminEmail,

            @Value("${app.admin.password}")
            String adminPassword
    ) {

        return args -> {

            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                throw new IllegalStateException(
                        "Admin email and password must be configured."
                );
            }

            if (adminPassword.length() < 12) {
                throw new IllegalStateException(
                        "Admin password must contain at least 12 characters."
                );
            }

            String email = adminEmail.trim()
                    .toLowerCase(Locale.ROOT);

            if (!repository.existsByEmailIgnoreCase(email)) {

                AppUser admin = new AppUser(
                        email,
                        passwordEncoder.encode(adminPassword),
                        "ADMIN"
                );

                repository.save(admin);

                System.out.println(
                        "Initial administrator account created successfully."
                );

            } else {

                System.out.println(
                        "Administrator account already exists."
                );
            }
        };
    }
}