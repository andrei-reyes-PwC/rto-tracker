package com.rtotracker.backend.auth;

import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminAuthorizationService {

    private final UserService users;

    public AdminAuthorizationService(UserService users) {
        this.users = users;
    }

    public User requireSuperAdmin(HttpServletRequest request) {
        User user = users.findByEmail(AuthSession.requireEmail(request));
        boolean isSuperAdmin = user.getRoles().stream().map(Role::getCode)
                .anyMatch("SUPER_ADMIN"::equals);
        if (!isSuperAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN access required");
        }
        return user;
    }
}
