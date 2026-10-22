package com.rtotracker.backend;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CsrfOriginInterceptorTest {

    private final CsrfOriginInterceptor interceptor = new CsrfOriginInterceptor("http://localhost:3000");

    @Test
    void rejectsStateChangingRequestFromUnexpectedOrigin() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users");
        request.addHeader("Origin", "https://attacker.example");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("Request origin is not allowed"));
    }

    @Test
    void acceptsConfiguredOriginAndReadOnlyRequests() throws Exception {
        MockHttpServletRequest write = new MockHttpServletRequest("POST", "/api/users");
        write.addHeader("Origin", "http://localhost:3000");
        assertTrue(interceptor.preHandle(write, new MockHttpServletResponse(), new Object()));

        MockHttpServletRequest read = new MockHttpServletRequest("GET", "/api/users");
        read.addHeader("Origin", "https://attacker.example");
        assertTrue(interceptor.preHandle(read, new MockHttpServletResponse(), new Object()));
    }

    @Test
    void rejectsCrossSiteRefererWhenOriginIsAbsent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/users/a@example.com");
        request.addHeader("Referer", "https://attacker.example/page");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertEquals(403, response.getStatus());
    }
}
