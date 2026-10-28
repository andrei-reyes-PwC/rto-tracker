package com.rtotracker.backend;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;

    public WebCorsConfig(
            @Value("${app.cors.allowed-origin}") String frontendOrigin,
            @Value("${app.swagger.allowed-origin:http://localhost:8080}") String swaggerOrigin) {
        List<String> origins = new ArrayList<>();
        origins.add(frontendOrigin);
        if (!swaggerOrigin.isBlank()) origins.add(swaggerOrigin);
        this.allowedOrigins = List.copyOf(origins);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
