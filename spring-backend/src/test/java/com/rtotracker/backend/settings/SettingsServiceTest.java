package com.rtotracker.backend.settings;

import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static com.rtotracker.backend.settings.SchedulingMode.*;

class SettingsServiceTest {
    private final GlobalSettingsRepository globals = mock(GlobalSettingsRepository.class);
    private final PlatformRepository platforms = mock(PlatformRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final SettingsService service = new SettingsService(globals, platforms, users);

    @Test
    void unassignedAndInheritingUsersFollowGlobalChangesWhileOverridesStayIndependent() {
        GlobalSettings global = new GlobalSettings();
        when(globals.findById(1L)).thenReturn(Optional.of(global));
        when(globals.lockPlanningWrites()).thenReturn(Optional.of(global));
        User user = new User("person@example.com", "hash");
        when(users.findById(user.getEmail())).thenReturn(Optional.of(user));
        assertEquals(List.of(), service.rulesForUser(user.getEmail()).daysOff());
        service.updateGlobal(true, true, PEZA);
        assertEquals(PEZA, service.rulesForUser(user.getEmail()).schedulingMode());
        assertEquals(List.of(6, 7), service.rulesForUser(user.getEmail()).daysOff());

        Platform platform = new Platform("Platform");
        user.setPlatform(platform);
        assertEquals(List.of(6, 7), service.rulesForUser(user.getEmail()).daysOff());
        platform.updatePlanningRules(false, true, FLEXIBLE);
        service.updateGlobal(true, false, PEZA);
        assertEquals(List.of(7), service.rulesForUser(user.getEmail()).daysOff());
        assertEquals(FLEXIBLE, service.rulesForUser(user.getEmail()).schedulingMode());

        when(platforms.findById(2L)).thenReturn(Optional.of(platform));
        assertTrue(service.updatePlatform(2L, true, false, false, FLEXIBLE).inheritGlobal());
        assertNull(platform.getSaturdayDayOff());
        assertNull(platform.getSundayDayOff());
        assertNull(platform.getSchedulingMode());
        assertEquals(PEZA, service.rulesForUser(user.getEmail()).schedulingMode());
        assertEquals(List.of(6), service.rulesForUser(user.getEmail()).daysOff());
    }

    @Test
    void resolvesSaturdayAndSundayIndependentlyAndNeverBlocksWeekdays() {
        var rules = new SettingsService.PlanningRules(true, false, FLEXIBLE);
        assertTrue(rules.isDayOff(LocalDate.of(2026, 10, 31)));
        assertFalse(rules.isDayOff(LocalDate.of(2026, 11, 1)));
        assertFalse(rules.isDayOff(LocalDate.of(2026, 11, 2)));
    }

    @Test
    void managementReadScopesPlatformAdminsWhileSuperAdminsSeeAllPlatforms() {
        when(globals.findById(1L)).thenReturn(Optional.of(new GlobalSettings()));
        Platform own = new Platform("Own platform");
        Platform other = new Platform("Other platform");
        when(platforms.findAll(any(Sort.class))).thenReturn(List.of(own, other));
        User actor = new User("manager@example.com", "hash");
        actor.setPlatform(own);
        assertEquals(List.of("Own platform"), service.managementSettings(actor, false).platforms().stream()
                .map(SettingsService.PlatformSettings::name).toList());
        verifyNoInteractions(platforms);
        assertEquals(2, service.managementSettings(actor, true).platforms().size());
    }

    @Test
    void deletedPlatformsCannotAcquireAnOverride() {
        when(globals.lockPlanningWrites()).thenReturn(Optional.of(new GlobalSettings()));
        when(platforms.findById(99L)).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class, () -> service.updatePlatform(99L, false, true, true, PEZA));
        assertEquals(404, error.getStatusCode().value());
        verify(platforms, never()).save(org.mockito.ArgumentMatchers.<@NonNull Platform>any());
    }
}
