package com.rtotracker.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public Message hello() {
        return new Message("RTO Tracker API is running");
    }

    public record Message(String message) {
    }
}
