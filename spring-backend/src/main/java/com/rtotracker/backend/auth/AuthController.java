package com.rtotracker.backend.auth;

import com.rtotracker.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String AUTHENTICATED_EMAIL = "authenticatedUserEmail";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        User user = authService.authenticate(request.email(), request.password());
        if (servletRequest.getSession(false) != null) {
            servletRequest.changeSessionId();
        }
        servletRequest.getSession(true).setAttribute(AUTHENTICATED_EMAIL, user.getEmail());
        return new LoginResponse(user.getEmail());
    }

    public record LoginRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String password) {
    }

    public record LoginResponse(String email) {
    }
}
