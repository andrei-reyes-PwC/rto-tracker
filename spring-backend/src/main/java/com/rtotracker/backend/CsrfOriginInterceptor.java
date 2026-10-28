package com.rtotracker.backend;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

@Component
public class CsrfOriginInterceptor implements HandlerInterceptor {

    private static final Set<String> STATE_CHANGING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final Set<String> allowedOrigins;

    public CsrfOriginInterceptor(
            @Value("${app.cors.allowed-origin}") String frontendOrigin,
            @Value("${app.swagger.allowed-origin:http://localhost:8080}") String swaggerOrigin) {
        this.allowedOrigins = new HashSet<>();
        this.allowedOrigins.add(originOf(frontendOrigin));
        if (!swaggerOrigin.isBlank()) this.allowedOrigins.add(originOf(swaggerOrigin));
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!STATE_CHANGING_METHODS.contains(request.getMethod().toUpperCase())) return true;
        String sourceHeader = request.getHeader("Origin");
        if (sourceHeader == null) sourceHeader = request.getHeader("Referer");
        if (sourceHeader == null || allowedOrigins.contains(originOf(sourceHeader))) return true;

        ApiErrorResponseWriter.write(response, HttpStatus.FORBIDDEN, "Request origin is not allowed");
        return false;
    }

    private static String originOf(String value) {
        try {
            URI uri = new URI(value);
            if (uri.getScheme() == null || uri.getHost() == null || uri.getUserInfo() != null) return "";
            return uri.getScheme().toLowerCase() + "://" + uri.getAuthority().toLowerCase();
        } catch (URISyntaxException exception) {
            return "";
        }
    }
}
