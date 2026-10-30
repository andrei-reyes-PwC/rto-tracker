package com.rtotracker.backend.auth;

import com.rtotracker.backend.platform.PlatformService;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PlatformService platformService;
    private final AssistantJwtService assistantJwtService;
    private final boolean secureSessionCookie;

    public AuthController(AuthService authService, PlatformService platformService,
                          AssistantJwtService assistantJwtService,
                          @Value("${server.servlet.session.cookie.secure:false}") boolean secureSessionCookie) {
        this.authService = authService;
        this.platformService = platformService;
        this.assistantJwtService = assistantJwtService;
        this.secureSessionCookie = secureSessionCookie;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        User user = authService.authenticate(request.email(), request.password());
        if (servletRequest.getSession(false) != null) {
            servletRequest.changeSessionId();
        }
        servletRequest.getSession(true).setAttribute(AuthSession.AUTHENTICATED_EMAIL_ATTRIBUTE, user.getEmail());
        return responseFor(user);
    }

    @GetMapping("/me")
    public LoginResponse currentUser(HttpServletRequest servletRequest) {
        return responseFor(authService.findByEmail(AuthSession.requireEmail(servletRequest)));
    }

    @PostMapping("/assistant-token")
    public AssistantJwtService.Token assistantToken(HttpServletRequest servletRequest) {
        return assistantJwtService.issue(AuthSession.requireEmail(servletRequest));
    }

    private LoginResponse responseFor(User user) {
        var platform = platformService.findForUser(user.getEmail());
        PlatformResponse response = platform.isEmpty() ? null
                : new PlatformResponse(platform.get().getId(), platform.get().getName());
        return LoginResponse.from(user, response);
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
                .secure(secureSessionCookie)
                .maxAge(0)
                .build();
        var response = ResponseEntity.noContent();
        response.header(HttpHeaders.SET_COOKIE, expiredSessionCookie.toString());
        return response.build();
    }

    public record LoginRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String password) {
    }

    public record LoginResponse(String email, List<@NonNull String> roles, @Nullable PlatformResponse platform) {
        static @NonNull LoginResponse from(User user, @Nullable PlatformResponse platform) {
            return new LoginResponse(user.getEmail(), user.getRoles().stream()
                    .map(Role::getCode).sorted().toList(), platform);
        }
    }

    public record PlatformResponse(Long id, String name) {
    }
}
