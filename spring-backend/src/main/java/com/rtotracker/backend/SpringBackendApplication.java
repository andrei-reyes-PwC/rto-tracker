package com.rtotracker.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class SpringBackendApplication {

    @Bean
    ApplicationRunner printSwaggerUrl(Environment environment) {
        return args -> {
            if (!environment.getProperty("springdoc.swagger-ui.enabled", Boolean.class, true)) return;
            String port = environment.getProperty("local.server.port",
                    environment.getProperty("server.port", "8080"));
            String contextPath = environment.getProperty("server.servlet.context-path", "");
            System.out.printf("Swagger UI: http://localhost:%s%s/swagger-ui.html%n", port, contextPath);
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(SpringBackendApplication.class, args);
    }
}
