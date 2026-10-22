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
import java.util.List;
import java.util.Set;

@Component
public class CsrfOriginInterceptor implements HandlerInterceptor {

    private static final Set<String> STATE_CHANGING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final String allowedOrigin;

    public CsrfOriginInterceptor(@Value("${app.cors.allowed-origin}") String allowedOrigin) {
        this.allowedOrigin = originOf(allowedOrigin);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!STATE_CHANGING_METHODS.contains(request.getMethod().toUpperCase())) return true;
        String sourceHeader = request.getHeader("Origin");
        if (sourceHeader == null) sourceHeader = request.getHeader("Referer");
        if (sourceHeader == null || originOf(sourceHeader).equals(allowedOrigin)) return true;

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
