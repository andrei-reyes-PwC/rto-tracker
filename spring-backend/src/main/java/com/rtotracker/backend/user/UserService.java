package com.rtotracker.backend.user;

import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.role.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final PasswordHashingService passwordHashingService;
    private final RoleRepository roles;

    public UserService(UserRepository users, PasswordHashingService passwordHashingService, RoleRepository roles) {
        this.users = users;
        this.passwordHashingService = passwordHashingService;
        this.roles = roles;
    }

    @Transactional(readOnly = true)
    public Page<UserController.UserResponse> findAll(Pageable pageable) {
        return users.findAll(pageable).map(UserController.UserResponse::from);
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
        return users.save(new User(normalizedEmail, passwordHashingService.hash(password),
                Set.of(defaultRole())));
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
        return users.save(new User(normalizedReplacement, current.getPasswordHash(), current.getRoles()));
    }

    public void delete(String email) {
        User user = findByEmail(email);
        users.delete(user);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Role defaultRole() {
        return roles.findById("USER")
                .orElseThrow(() -> new IllegalStateException("The USER role is missing from the role catalog"));
    }
}
