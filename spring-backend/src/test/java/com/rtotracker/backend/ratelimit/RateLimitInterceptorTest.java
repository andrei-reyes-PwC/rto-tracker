package com.rtotracker.backend.ratelimit;

import com.rtotracker.backend.auth.AuthSession;
import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimitInterceptorTest {

    private final RateLimitProperties properties = new RateLimitProperties();
    private final RateLimitStore rateLimits = mock(RateLimitStore.class);
    private final ClientAddressResolver addresses = new ClientAddressResolver(properties);
    private final RateLimitInterceptor interceptor = new RateLimitInterceptor(
            properties, rateLimits, addresses);

    @Test
    void returns429AndRetryAfterWhenGlobalLimitIsExceeded() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/roles");
        request.setRemoteAddr("203.0.113.10");
        when(rateLimits.consume("api-ip", "203.0.113.10", 120, 60_000))
                .thenReturn(new RateLimitStore.Decision(false, 5_000L));
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertEquals(429, response.getStatus());
        assertEquals("5", response.getHeader("Retry-After"));
        assertTrue(response.getContentAsString().contains("API request limit exceeded"));
    }

    @Test
    void appliesTighterLimitToLoginRequests() throws Exception {
        MockHttpServletRequest request = request("POST", "/api/auth/login");
        request.setRemoteAddr("203.0.113.10");
        when(rateLimits.consume(eq("api-ip"), anyString(), eq(120), anyLong()))
                .thenReturn(new RateLimitStore.Decision(true, 60_000L));
        when(rateLimits.consume("login-ip", "203.0.113.10", 50, 900_000))
                .thenReturn(new RateLimitStore.Decision(false, 900_000L));
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertEquals(429, response.getStatus());
        assertEquals("900", response.getHeader("Retry-After"));
    }

    @Test
    void usesAuthenticatedUserBucketForSignedInApiRequests() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/users");
        request.getSession().setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, "Admin@Example.com");
        request.setRemoteAddr("203.0.113.10");
        when(rateLimits.consume("api-user", "admin@example.com", 120, 60_000))
                .thenReturn(new RateLimitStore.Decision(true, 60_000L));
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(interceptor.preHandle(request, response, new Object()));
        verify(rateLimits).consume("api-user", "admin@example.com", 120, 60_000);
        verify(rateLimits, never()).consume(eq("api-ip"), anyString(), eq(120), anyLong());
    }

    @Test
    void doesNotCountCorsPreflightRequests() throws Exception {
        MockHttpServletRequest request = request("OPTIONS", "/api/users");

        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
        verify(rateLimits, never()).consume(anyString(), anyString(), org.mockito.ArgumentMatchers.anyInt(), anyLong());
    }

    @Test
    void failsClosedWhenBucketCapacityIsExhausted() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/roles");
        request.setRemoteAddr("203.0.113.10");
        doThrow(new RateLimitCapacityExceededException())
                .when(rateLimits).consume("api-ip", "203.0.113.10", 120, 60_000);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertEquals(503, response.getStatus());
    }

    private static @NonNull MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        return request;
    }
}
