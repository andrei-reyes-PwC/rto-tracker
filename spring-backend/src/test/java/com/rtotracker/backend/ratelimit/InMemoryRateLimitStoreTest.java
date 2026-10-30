package com.rtotracker.backend.ratelimit;

import org.junit.jupiter.api.Test;

import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryRateLimitStoreTest {

    @Test
    void enforcesLimitAndBoundsNumberOfTrackedBuckets() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setMaxBuckets(1);
        InMemoryRateLimitStore store = new InMemoryRateLimitStore(properties);

        assertTrue(store.consume("api-ip", "client-a", 1, 60_000).allowed());
        assertFalse(store.consume("api-ip", "client-a", 1, 60_000).allowed());
        assertThrows(RateLimitCapacityExceededException.class,
                () -> store.consume("api-ip", "client-b", 1, 60_000));
    }

    @Test
    void countsConcurrentRequestsAtomically() throws Exception {
        RateLimitProperties properties = new RateLimitProperties();
        InMemoryRateLimitStore store = new InMemoryRateLimitStore(properties);
        try (var executor = Executors.newFixedThreadPool(8)) {
            var requests = java.util.stream.IntStream.range(0, 32)
                    .mapToObj(_ -> executor.submit(
                            () -> store.consume("api-ip", "same-client", 5, 60_000).allowed()))
                    .toList();
            long allowed = 0;
            for (var request : requests) if (request.get()) allowed++;
            assertEquals(5, allowed);
        }
    }
}
