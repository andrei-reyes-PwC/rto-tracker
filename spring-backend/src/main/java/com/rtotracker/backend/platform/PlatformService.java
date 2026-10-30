package com.rtotracker.backend.platform;

import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class PlatformService {

    private final PlatformRepository platforms;
    public PlatformService(PlatformRepository platforms) {
        this.platforms = platforms;
    }

    @Transactional(readOnly = true)
    public List<PlatformRepository.@NonNull PlatformSummaryProjection> findAllSummaries(String search) {
        return platforms.findAllSummaries(search.trim().toLowerCase());
    }

    @Transactional(readOnly = true)
    public List<PlatformRepository.@NonNull PlatformOptionProjection> findAllOptions() {
        return platforms.findAllOptions();
    }

    @Transactional(readOnly = true)
    public List<@NonNull Platform> findAll() {
        return platforms.findAll(Sort.<@NonNull Platform>by(Sort.Direction.ASC, Platform::getName));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<PlatformRepository.PlatformOptionProjection> findForUser(String email) {
        return platforms.findForUser(email);
    }

    public Platform create(String name) {
        String normalizedName = normalizeName(name);
        if (platforms.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A platform with this name already exists");
        }
        return platforms.save(new Platform(normalizedName));
    }

    public Platform update(Long id, String name) {
        Platform platform = Objects.requireNonNull(platforms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found")));
        String normalizedName = normalizeName(name);
        if (platforms.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A platform with this name already exists");
        }
        platform.updateName(normalizedName);
        return platform;
    }

    public void delete(Long id) {
        Platform platform = Objects.requireNonNull(platforms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found")));
        platforms.delete(platform);
    }

    private static String normalizeName(String name) {
        return name.trim();
    }
}
