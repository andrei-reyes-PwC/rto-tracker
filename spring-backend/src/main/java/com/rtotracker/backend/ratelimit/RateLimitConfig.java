package com.rtotracker.backend.ratelimit;

import com.rtotracker.backend.CsrfOriginInterceptor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig implements WebMvcConfigurer {

    private final @NonNull RateLimitInterceptor interceptor;
    private final @NonNull CsrfOriginInterceptor csrfOriginInterceptor;

    public RateLimitConfig(@NonNull RateLimitInterceptor interceptor, @NonNull CsrfOriginInterceptor csrfOriginInterceptor) {
        this.interceptor = interceptor;
        this.csrfOriginInterceptor = csrfOriginInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(csrfOriginInterceptor).addPathPatterns("/api/**");
        registry.addInterceptor(interceptor).addPathPatterns("/api/**");
    }
}
