package com.rtotracker.backend.user;

import com.rtotracker.backend.auth.AuthSession;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformService;
import com.rtotracker.backend.role.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@Validated
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Create and manage users identified by email")
public class UserController {

    private final UserService userService;
    private final PlatformService platformService;

    public UserController(UserService userService, PlatformService platformService) {
        this.userService = userService;
        this.platformService = platformService;
    }

    @GetMapping
    @Operation(summary = "List users")
    public UserPageResponse findAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Min(1) Long platformId,
            @RequestParam(defaultValue = "true") boolean includePlatforms,
            HttpServletRequest request) {
        requireSuperAdmin(request);
        Pageable pageable = PageRequest.of(page, size, platformId == null
                ? Sort.by(Sort.Direction.ASC, "email")
                : Sort.unsorted());
        Page<UserResponse> users = userService.findAll(pageable, platformId);
        List<PlatformResponse> platforms = includePlatforms
                ? platformService.findAll().stream().map(PlatformResponse::from).toList()
                : List.of();
        return UserPageResponse.from(users, platforms);
    }

    @GetMapping("/manage")
    @Operation(summary = "List users and platform memberships for user management")
    public UserManagementPageResponse findAllForManagement(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Min(1) Long platformId,
            HttpServletRequest request) {
        requireSuperAdmin(request);
        Pageable pageable = PageRequest.of(page, size, platformId == null
                ? Sort.by(Sort.Direction.ASC, "email")
                : Sort.unsorted());
        Page<UserResponse> users = userService.findAll(pageable, platformId);
        List<PlatformOption> options = platformService.findAllOptions().stream()
                .map(platform -> new PlatformOption(platform.getId(), platform.getName())).toList();
        Map<String, List<PlatformOption>> membershipsByEmail = new LinkedHashMap<>();
        platformService.findMembershipsForUsers(users.getContent().stream().map(UserResponse::email).toList())
                .forEach(membership -> membershipsByEmail
                        .computeIfAbsent(membership.getUserEmail(), ignored -> new ArrayList<>())
                        .add(new PlatformOption(membership.getId(), membership.getName())));
        List<ManagedUserResponse> content = users.getContent().stream()
                .map(user -> new ManagedUserResponse(user.email(), user.roles(),
                        membershipsByEmail.getOrDefault(user.email(), List.of())))
                .toList();
        return new UserManagementPageResponse(content, users.getTotalElements(), users.getTotalPages(),
                users.getNumber(), users.getSize(), options);
    }

    @GetMapping("/{email}")
    @Operation(summary = "Get a user by email")
    public UserResponse findByEmail(@PathVariable String email, HttpServletRequest request) {
        requireSuperAdmin(request);
        return UserResponse.from(userService.findByEmail(email));
    }

    @PostMapping
    @Operation(summary = "Create a user")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody UserRequest request,
            HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        UserResponse created = UserResponse.from(userService.create(request.email(), request.password()));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{email}").buildAndExpand(created.email()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{email}")
    @Operation(summary = "Update a user's email and roles")
    public UserResponse update(
            @PathVariable String email,
            @Valid @RequestBody UserUpdateRequest request,
            HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return UserResponse.from(userService.update(email, request.email(), request.roles()));
    }

    @DeleteMapping("/{email}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<Void> delete(@PathVariable String email, HttpServletRequest request) {
        User administrator = requireSuperAdmin(request);

        User target = userService.findByEmail(email);
        if (administrator.getEmail().equals(target.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete your own account");
        }
        boolean isProtected = target.getRoles().stream().anyMatch(role -> role.isProtectedRole());
        if (isProtected) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Protected users cannot be deleted");
        }
        userService.delete(email);
        return ResponseEntity.noContent().build();
    }

    private User requireSuperAdmin(HttpServletRequest request) {
        User user = userService.findByEmail(AuthSession.requireEmail(request));
        boolean isSuperAdmin = user.getRoles().stream()
                .map(Role::getCode)
                .anyMatch("SUPER_ADMIN"::equals);
        if (!isSuperAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN access required");
        }
        return user;
    }

    public record UserRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record UserUpdateRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotEmpty List<@NotBlank String> roles) {
    }

    public record UserPageResponse(List<UserResponse> content, long totalElements, int totalPages,
                                   int number, int size, List<PlatformResponse> platforms) {
        static UserPageResponse from(Page<UserResponse> users, List<PlatformResponse> platforms) {
            return new UserPageResponse(users.getContent(), users.getTotalElements(), users.getTotalPages(),
                    users.getNumber(), users.getSize(), platforms);
        }
    }

    public record UserManagementPageResponse(List<ManagedUserResponse> content, long totalElements, int totalPages,
                                             int number, int size, List<PlatformOption> platforms) {
    }

    public record ManagedUserResponse(String email, List<String> roles, List<PlatformOption> platforms) {
    }

    public record PlatformOption(Long id, String name) {
    }

    public record PlatformResponse(Long id, String name, List<String> userEmails) {
        static PlatformResponse from(Platform platform) {
            return new PlatformResponse(platform.getId(), platform.getName(), platform.getUsers().stream()
                    .map(User::getEmail).sorted().toList());
        }
    }

    public record UserResponse(String email, List<String> roles) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getEmail(), user.getRoles().stream()
                    .map(Role::getCode).sorted().toList());
        }
    }
}
