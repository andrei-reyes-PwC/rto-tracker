package com.rtotracker.backend.role;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jspecify.annotations.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@Tag(name = "Roles", description = "Read the available role catalog")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @Operation(summary = "List available roles")
    public List<@NonNull RoleResponse> findAll() {
        return roleService.findAll().stream()
                .map(role -> new RoleResponse(role.getCode(), role.isProtectedRole()))
                .toList();
    }

    public record RoleResponse(String code, boolean protectedRole) {
    }
}
