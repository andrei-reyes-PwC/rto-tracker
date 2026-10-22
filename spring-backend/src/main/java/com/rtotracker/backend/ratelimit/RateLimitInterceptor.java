package com.rtotracker.backend.ratelimit;

import com.rtotracker.backend.ApiErrorResponseWriter;
import com.rtotracker.backend.auth.AuthSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitProperties properties;
    private final RateLimitStore rateLimits;
    private final ClientAddressResolver addresses;

    public RateLimitInterceptor(RateLimitProperties properties, RateLimitStore rateLimits,
                                ClientAddressResolver addresses) {
        this.properties = properties;
        this.rateLimits = rateLimits;
        this.addresses = addresses;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!properties.isEnabled() || "OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String address = addresses.resolve(request);
        String identity = authenticatedIdentity(request);
        try {
            if (identity == null) {
                if (!consume(response, "api-ip", address, properties.getGeneralRequests(),
                        properties.getGeneralWindowMillis(), "API request limit exceeded")) return false;
            } else if (!consume(response, "api-user", identity, properties.getGeneralRequests(),
                    properties.getGeneralWindowMillis(), "API request limit exceeded")) {
                return false;
            }

            String requestPath = request.getRequestURI().substring(request.getContextPath().length());
            if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/auth/login".equals(requestPath)) {
                if (!consume(response, "login-ip", address, properties.getLoginIpRequests(),
                        properties.getLoginWindowMillis(), "Login request limit exceeded")) return false;
            }
            return true;
        } catch (RateLimitCapacityExceededException exception) {
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE,
                    "Rate limit capacity is temporarily exhausted. Please retry shortly.", 0);
            return false;
        }
    }

    private boolean consume(HttpServletResponse response, String bucket, String subject,
                            int limit, long window, String message) throws IOException {
        RateLimitStore.Decision decision = rateLimits.consume(bucket, subject, limit, window);
        if (decision.allowed()) return true;
        writeError(response, HttpStatus.TOO_MANY_REQUESTS, message,
                Math.max(1, (long) Math.ceil(decision.retryAfterMillis() / 1000.0)));
        return false;
    }

    private static String authenticatedIdentity(HttpServletRequest request) {
        var session = request.getSession(false);
        Object email = session == null ? null : session.getAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE);
        return email instanceof String value && !value.isBlank() ? value.toLowerCase(Locale.ROOT) : null;
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message, long retryAfter)
            throws IOException {
        if (retryAfter > 0) response.setHeader("Retry-After", Long.toString(retryAfter));
        ApiErrorResponseWriter.write(response, status, message);
    }
}
