package com.rtotracker.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AuthSession {

    public static final String AUTHENTICATED_EMAIL_ATTRIBUTE = "authenticatedUserEmail";

    private AuthSession() {
    }

    public static String requireEmail(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object email = session == null ? null : session.getAttribute(AUTHENTICATED_EMAIL_ATTRIBUTE);
        if (!(email instanceof String authenticatedEmail) || authenticatedEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return authenticatedEmail;
    }
}
