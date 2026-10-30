package com.rtotracker.backend;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final List<@NonNull String> allowedOrigins;

    public WebCorsConfig(
            @Value("${app.cors.allowed-origin}") @NonNull String frontendOrigin,
            @Value("${app.swagger.allowed-origin:http://localhost:8080}") @NonNull String swaggerOrigin) {
        List<@NonNull String> origins = new ArrayList<>();
        origins.add(frontendOrigin);
        if (!swaggerOrigin.isBlank()) origins.add(swaggerOrigin);
        this.allowedOrigins = List.copyOf(origins);
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(Objects.requireNonNull(allowedOrigins.toArray(String[]::new)))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
