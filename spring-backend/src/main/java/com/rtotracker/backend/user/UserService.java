package com.rtotracker.backend.user;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final PasswordHashingService passwordHashingService;

    public UserService(UserRepository users, PasswordHashingService passwordHashingService) {
        this.users = users;
        this.passwordHashingService = passwordHashingService;
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return users.findAll(Sort.by(Sort.Direction.ASC, "email"));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return users.findById(normalize(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User create(String email, String password) {
        String normalizedEmail = normalize(email);
        if (users.existsById(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }
        return users.save(new User(normalizedEmail, passwordHashingService.hash(password)));
    }

    public User update(String currentEmail, String replacementEmail) {
        User current = findByEmail(currentEmail);
        String normalizedReplacement = normalize(replacementEmail);
        if (current.getEmail().equals(normalizedReplacement)) {
            return current;
        }
        if (users.existsById(normalizedReplacement)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }
        users.delete(current);
        users.flush();
        return users.save(new User(normalizedReplacement, current.getPasswordHash()));
    }

    public void delete(String email) {
        User user = findByEmail(email);
        users.delete(user);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
