package com.rtotracker.backend.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientAddressResolverTest {

    @Test
    void ignoresForwardedAddressFromUntrustedRemote() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setTrustedProxies(List.of("10.0.0.0/8"));
        ClientAddressResolver resolver = new ClientAddressResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.10");
        request.addHeader("X-Forwarded-For", "203.0.113.7");

        assertEquals("192.0.2.10", resolver.resolve(request));
    }

    @Test
    void resolvesClientFromForwardedChainWhenImmediateProxyIsTrusted() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setTrustedProxies(List.of("10.0.0.0/8"));
        ClientAddressResolver resolver = new ClientAddressResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.4");
        request.addHeader("X-Forwarded-For", "203.0.113.7, 10.0.0.3");

        assertEquals("203.0.113.7", resolver.resolve(request));
    }
}
