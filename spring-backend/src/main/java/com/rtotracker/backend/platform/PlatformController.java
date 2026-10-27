package com.rtotracker.backend.platform;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
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
@Validated
@RequestMapping("/api/platforms")
@Tag(name = "Platforms", description = "Group users into platforms")
public class PlatformController {

    private final PlatformService platformService;
    private final AdminAuthorizationService authorization;

    public PlatformController(PlatformService platformService, AdminAuthorizationService authorization) {
        this.platformService = platformService;
        this.authorization = authorization;
    }

    @GetMapping
    @Operation(summary = "List platforms")
    public List<PlatformSummary> findAll(@RequestParam(defaultValue = "") String search, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return platformService.findAllSummaries(search).stream()
                .map(platform -> new PlatformSummary(platform.getId(), platform.getName(), platform.getUserCount()))
                .toList();
    }

    @GetMapping("/options")
    @Operation(summary = "List platform options for filters")
    public List<PlatformOption> findAllOptions(HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return platformService.findAllOptions().stream()
                .map(platform -> new PlatformOption(platform.getId(), platform.getName()))
                .toList();
    }

    @PostMapping
    @Operation(summary = "Create a platform")
    public ResponseEntity<PlatformResponse> create(@Valid @RequestBody PlatformRequest request,
                                                    HttpServletRequest servletRequest) {
        authorization.requireSuperAdmin(servletRequest);
        PlatformResponse created = PlatformResponse.from(
                platformService.create(request.name()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a platform and its members")
    public PlatformResponse update(@PathVariable Long id, @Valid @RequestBody PlatformRequest request,
                                   HttpServletRequest servletRequest) {
        authorization.requireSuperAdmin(servletRequest);
        return PlatformResponse.from(platformService.update(id, request.name()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a platform")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        platformService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record PlatformRequest(@NotBlank @Size(max = 20) String name) {
    }

    public record PlatformResponse(Long id, String name) {
        public static PlatformResponse from(Platform platform) {
            return new PlatformResponse(platform.getId(), platform.getName());
        }
    }

    public record PlatformSummary(Long id, String name, long userCount) {
    }

    public record PlatformOption(Long id, String name) {
    }
}
