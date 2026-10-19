package com.rtotracker.backend.auth;

import com.rtotracker.backend.user.PasswordHashingService;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

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
        User user = users.findById(normalizedEmail).orElse(null);
        if (user == null || user.getPasswordHash() == null
                || !passwords.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return user;
    }
}
