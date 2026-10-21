package com.rtotracker.backend.platform;

import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlatformService {

    private final PlatformRepository platforms;
    private final UserRepository users;

    public PlatformService(PlatformRepository platforms, UserRepository users) {
        this.platforms = platforms;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<PlatformRepository.PlatformSummaryProjection> findAllSummaries() {
        return platforms.findAllSummaries();
    }

    @Transactional(readOnly = true)
    public List<PlatformRepository.PlatformOptionProjection> findAllOptions() {
        return platforms.findAllOptions();
    }

    @Transactional(readOnly = true)
    public List<Platform> findAll() {
        return platforms.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Transactional(readOnly = true)
    public Platform findById(Long id) {
        return platforms.findByIdWithUsers(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<PlatformRepository.PlatformOptionProjection> findForUser(String email) {
        return platforms.findForUser(email);
    }

    public Platform create(String name, List<String> userEmails) {
        String normalizedName = normalizeName(name);
        if (platforms.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A platform with this name already exists");
        }
        return platforms.save(new Platform(normalizedName, findUsers(userEmails, null)));
    }

    public Platform update(Long id, String name, List<String> userEmails) {
        Platform platform = platforms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));
        String normalizedName = normalizeName(name);
        if (platforms.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A platform with this name already exists");
        }
        platform.update(normalizedName, findUsers(userEmails, id));
        return platform;
    }

    public void delete(Long id) {
        Platform platform = platforms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));
        platforms.delete(platform);
    }

    private Set<User> findUsers(List<String> requestedEmails, Long currentPlatformId) {
        Set<String> emails = requestedEmails.stream()
                .map(email -> email.trim().toLowerCase(java.util.Locale.ROOT))
                .collect(Collectors.toSet());
        if (emails.contains("")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User emails must not be blank");
        }
        List<User> foundUsers = users.findAllById(emails);
        if (foundUsers.size() != emails.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected users do not exist");
        }
        boolean alreadyAssigned = foundUsers.stream().anyMatch(user -> user.getPlatform() != null
                && !user.getPlatform().getId().equals(currentPlatformId));
        if (alreadyAssigned) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Each user can belong to only one platform");
        }
        return Set.copyOf(foundUsers);
    }

    private static String normalizeName(String name) {
        return name.trim();
    }
}
