package com.rtotracker.backend.site;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
public class SiteController {
    private final SiteService sites;
    private final AdminAuthorizationService authorization;
    public SiteController(SiteService sites, AdminAuthorizationService authorization) {
        this.sites = sites;
        this.authorization = authorization;
    }

    @GetMapping
    public List<@NonNull SiteSummary> findAll(@RequestParam(defaultValue = "") String search, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return sites.findAll(search).stream()
                .map(site -> new SiteSummary(site.getId(), site.getName(), site.getUserCount()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<@NonNull SiteResponse> create(@Valid @RequestBody SiteRequest body, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        SiteResponse created = SiteResponse.from(sites.create(body.name()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public SiteResponse update(@PathVariable Long id, @Valid @RequestBody SiteRequest body,
                               HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return SiteResponse.from(sites.update(id, body.name()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        sites.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record SiteRequest(@NotBlank @Size(max = 25) String name) {
    }

    public record SiteSummary(Long id, String name, long userCount) { }

    public record SiteResponse(Long id, String name) {
        static @NonNull SiteResponse from(Site site) {
            return new SiteResponse(site.getId(), site.getName());
        }
    }
}
