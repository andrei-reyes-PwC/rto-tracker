package com.rtotracker.backend.settings;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsService settings;
    private final AdminAuthorizationService authorization;

    public SettingsController(SettingsService settings, AdminAuthorizationService authorization) {
        this.settings = settings;
        this.authorization = authorization;
    }

    @GetMapping
    public SettingsService.ManagementSettings managementSettings(HttpServletRequest request) {
        User actor = authorization.requireUserManagementAccess(request);
        return settings.managementSettings(actor, authorization.isSuperAdmin(actor));
    }

    @PutMapping("/global")
    public SettingsService.WeekendRules updateGlobal(@Valid @RequestBody WeekendRequest body, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return settings.updateGlobal(body.saturdayDayOff(), body.sundayDayOff());
    }

    @PutMapping("/platforms/{id}")
    public SettingsService.PlatformSettings updatePlatform(@PathVariable Long id,
            @Valid @RequestBody PlatformRequest body, HttpServletRequest request) {
        User actor = authorization.requireUserManagementAccess(request);
        if (!authorization.isSuperAdmin(actor)
                && (actor.getPlatform() == null || !id.equals(actor.getPlatform().getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage settings for your assigned platform");
        }
        return settings.updatePlatform(id, body.inheritGlobal(), body.saturdayDayOff(), body.sundayDayOff());
    }

    public record WeekendRequest(@NotNull Boolean saturdayDayOff, @NotNull Boolean sundayDayOff) { }
    public record PlatformRequest(@NotNull Boolean inheritGlobal, @NotNull Boolean saturdayDayOff,
                                  @NotNull Boolean sundayDayOff) { }
}
