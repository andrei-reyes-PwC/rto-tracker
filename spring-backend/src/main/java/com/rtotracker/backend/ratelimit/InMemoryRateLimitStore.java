package com.rtotracker.backend.ratelimit;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class InMemoryRateLimitStore implements RateLimitStore {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Semaphore capacity;
    private final AtomicInteger operations = new AtomicInteger();

    public InMemoryRateLimitStore(RateLimitProperties properties) {
        this.capacity = new Semaphore(properties.getMaxBuckets());
    }

    @Override
    public Decision consume(String bucket, String subject, int limit, long windowMillis) {
        long now = System.nanoTime();
        String key = bucket + ":" + digest(subject);
        if ((operations.incrementAndGet() & 0x3ff) == 0
                || (!buckets.containsKey(key) && capacity.availablePermits() == 0)) {
            removeExpired(now);
        }
        long windowNanos = TimeUnit.MILLISECONDS.toNanos(windowMillis);
        AtomicReference<Decision> decision = new AtomicReference<>();
        AtomicReference<Boolean> capacityExceeded = new AtomicReference<>(false);

        buckets.compute(key, (ignored, current) -> {
            if (current == null || expired(current, now)) {
                if (current == null && !capacity.tryAcquire()) {
                    capacityExceeded.set(true);
                    return null;
                }
                Bucket next = new Bucket(now + windowNanos, 1);
                decision.set(new Decision(true, windowMillis));
                return next;
            }
            if (current.count() < limit) {
                decision.set(new Decision(true, current.expiresAtNanos() - now));
                return new Bucket(current.expiresAtNanos(), current.count() + 1);
            }
            decision.set(new Decision(false, current.expiresAtNanos() - now));
            return current;
        });

        if (capacityExceeded.get()) throw new RateLimitCapacityExceededException();
        Decision result = decision.get();
        return new Decision(result.allowed(), Math.max(1, TimeUnit.NANOSECONDS.toMillis(result.retryAfterMillis())));
    }

    private void removeExpired(long now) {
        buckets.forEach((key, value) -> {
            if (expired(value, now) && buckets.remove(key, value)) capacity.release();
        });
    }

    private static boolean expired(Bucket bucket, long now) {
        return now - bucket.expiresAtNanos() >= 0;
    }

    private static String digest(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private record Bucket(long expiresAtNanos, int count) { }
}
