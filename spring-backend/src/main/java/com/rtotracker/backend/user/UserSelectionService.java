package com.rtotracker.backend.user;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserSelectionService {

    private final UserRepository users;

    public UserSelectionService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Set<User> findExistingByEmails(List<String> requestedEmails) {
        Set<String> emails = requestedEmails.stream()
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (emails.contains("")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User emails must not be blank");
        }
        List<User> foundUsers = users.findAllById(emails);
        if (foundUsers.size() != emails.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected users do not exist");
        }
        return Set.copyOf(foundUsers);
    }
}
