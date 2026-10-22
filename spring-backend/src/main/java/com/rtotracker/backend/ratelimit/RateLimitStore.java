package com.rtotracker.backend.ratelimit;

public interface RateLimitStore {

    Decision consume(String bucket, String subject, int limit, long windowMillis);

    record Decision(boolean allowed, long retryAfterMillis) { }
}
