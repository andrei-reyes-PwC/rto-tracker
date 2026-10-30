package com.rtotracker.backend.auth;

import com.rtotracker.backend.user.PasswordHashingService;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Objects;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordHashingService passwords;

    public AuthService(UserRepository users, PasswordHashingService passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    public User authenticate(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = Objects.requireNonNull(users.findById(normalizedEmail).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")));
        String passwordHash = user.getPasswordHash();
        if (passwordHash == null || !passwords.matches(password, passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return user;
    }

    public User findByEmail(String email) {
        return users.findById(email).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session user no longer exists"));
    }
}
