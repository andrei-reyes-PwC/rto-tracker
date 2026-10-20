package com.rtotracker.backend.user;

import com.rtotracker.backend.role.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import java.net.URI;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Create and manage users identified by email")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List users")
    public Page<UserResponse> findAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "email"));
        return userService.findAll(pageable);
    }

    @GetMapping("/{email}")
    @Operation(summary = "Get a user by email")
    public UserResponse findByEmail(@PathVariable String email) {
        return UserResponse.from(userService.findByEmail(email));
    }

    @PostMapping
    @Operation(summary = "Create a user")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        UserResponse created = UserResponse.from(userService.create(request.email(), request.password()));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{email}").buildAndExpand(created.email()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{email}")
    @Operation(summary = "Change a user's email")
    public UserResponse update(
            @PathVariable String email,
            @Valid @RequestBody UserRequest request) {
        return UserResponse.from(userService.update(email, request.email()));
    }

    @DeleteMapping("/{email}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<Void> delete(@PathVariable String email) {
        userService.delete(email);
        return ResponseEntity.noContent().build();
    }

    public record UserRequest(
            @NotBlank @Email @Pattern(regexp = "^[^@\\s]+@(?:[^@.\\s]+\\.)+[^@.\\s]+$")
            @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record UserResponse(String email, List<String> roles) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getEmail(), user.getRoles().stream()
                    .map(Role::getCode).sorted().toList());
        }
    }
}
