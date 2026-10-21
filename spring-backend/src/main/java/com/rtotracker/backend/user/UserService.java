package com.rtotracker.backend.user;

import com.rtotracker.backend.office.OfficeDayRepository;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.role.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final PasswordHashingService passwordHashingService;
    private final RoleRepository roles;
    private final OfficeDayRepository officeDays;

    public UserService(
            UserRepository users,
            PasswordHashingService passwordHashingService,
            RoleRepository roles,
            OfficeDayRepository officeDays) {
        this.users = users;
        this.passwordHashingService = passwordHashingService;
        this.roles = roles;
        this.officeDays = officeDays;
    }

    @Transactional(readOnly = true)
    public Page<UserController.UserResponse> findAll(Pageable pageable, Long platformId) {
        Page<User> matchingUsers = platformId == null
                ? users.findAll(pageable)
                : users.findAllByPlatformId(platformId, pageable);
        return matchingUsers.map(UserController.UserResponse::from);
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

    public User update(String currentEmail, String replacementEmail, List<String> requestedRoleCodes) {
        User current = findByEmail(currentEmail);
        if (current.getRoles().stream().anyMatch(Role::isProtectedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected users cannot be edited");
        }

        String normalizedReplacement = normalize(replacementEmail);
        if (!current.getEmail().equals(normalizedReplacement) && users.existsById(normalizedReplacement)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }

        Set<String> requestedCodes = requestedRoleCodes.stream()
                .map(String::trim)
                .collect(Collectors.toSet());
        if (requestedCodes.isEmpty() || requestedCodes.contains("")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one valid role");
        }
        List<Role> requestedRoles = roles.findAllById(requestedCodes);
        if (requestedRoles.size() != requestedCodes.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more roles do not exist");
        }
        if (requestedRoles.stream().anyMatch(Role::isProtectedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected roles cannot be assigned");
        }

        Set<Role> replacementRoles = Set.copyOf(requestedRoles);
        if (current.getEmail().equals(normalizedReplacement)) {
            current.setRoles(replacementRoles);
            return current;
        }

        User replacementUser = new User(normalizedReplacement, current.getPasswordHash(), replacementRoles);
        replacementUser.setPlatform(current.getPlatform());
        replacementUser.setWorkSchedule(current.getWorkSchedule());
        User replacement = users.save(replacementUser);
        users.flush();
        officeDays.updateUserEmail(current.getEmail(), normalizedReplacement);
        users.delete(current);
        users.flush();
        return findByEmail(replacement.getEmail());
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
