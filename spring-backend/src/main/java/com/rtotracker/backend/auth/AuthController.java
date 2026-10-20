package com.rtotracker.backend.auth;

import com.rtotracker.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

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
        servletRequest.getSession(true).setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, user.getEmail());
        return new LoginResponse(user.getEmail());
    }

    @GetMapping("/me")
    public LoginResponse currentUser(HttpServletRequest servletRequest) {
        return new LoginResponse(AuthSession.requireEmail(servletRequest));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest servletRequest) {
        var session = servletRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        ResponseCookie expiredSessionCookie = ResponseCookie.from("JSESSIONID", "")
                .path("/")
                .httpOnly(true)
                .sameSite("Lax")
                .maxAge(Duration.ZERO)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredSessionCookie.toString())
                .build();
    }

    public record LoginRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String password) {
    }

    public record LoginResponse(String email) {
    }
}
