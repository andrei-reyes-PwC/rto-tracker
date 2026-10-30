package com.rtotracker.backend.ratelimit;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties("app.rate-limit")
@Validated
public class RateLimitProperties {

    private boolean enabled = true;
    @Min(1)
    private int generalRequests = 120;
    @Min(1_000)
    @Max(86_400_000)
    private long generalWindowMillis = 60_000;
    @Min(1)
    private int loginIpRequests = 50;
    @Min(1_000)
    @Max(86_400_000)
    private long loginWindowMillis = 900_000;
    @Min(1)
    private int maxBuckets = 100_000;
    private List<@NonNull String> trustedProxies = new ArrayList<>();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getGeneralRequests() { return generalRequests; }
    public void setGeneralRequests(int generalRequests) { this.generalRequests = generalRequests; }
    public long getGeneralWindowMillis() { return generalWindowMillis; }
    public void setGeneralWindowMillis(long generalWindowMillis) { this.generalWindowMillis = generalWindowMillis; }
    public int getLoginIpRequests() { return loginIpRequests; }
    public void setLoginIpRequests(int loginIpRequests) { this.loginIpRequests = loginIpRequests; }
    public long getLoginWindowMillis() { return loginWindowMillis; }
    public void setLoginWindowMillis(long loginWindowMillis) { this.loginWindowMillis = loginWindowMillis; }
    public int getMaxBuckets() { return maxBuckets; }
    public void setMaxBuckets(int maxBuckets) { this.maxBuckets = maxBuckets; }
    public List<@NonNull String> getTrustedProxies() { return trustedProxies; }
    public void setTrustedProxies(List<@NonNull String> trustedProxies) { this.trustedProxies = trustedProxies; }
}
