package com.rtotracker.backend.settings;

import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class SettingsService {
    private final GlobalSettingsRepository globals;
    private final PlatformRepository platforms;
    private final UserRepository users;

    public SettingsService(GlobalSettingsRepository globals, PlatformRepository platforms, UserRepository users) {
        this.globals = globals;
        this.platforms = platforms;
        this.users = users;
    }

    public ManagementSettings managementSettings(User actor, boolean superAdmin) {
        WeekendRules global = globalRules();
        List<@NonNull Platform> visible = superAdmin
                ? platforms.findAll(Sort.<@NonNull Platform>by(Platform::getName))
                : List.of(Objects.requireNonNull(actor.getPlatform()));
        return new ManagementSettings(global, visible.stream().map(platform -> platformSettings(platform, global)).toList());
    }

    public WeekendRules rulesForUser(String email) {
        User user = Objects.requireNonNull(users.findById(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found")));
        return effectiveRules(user.getPlatform(), globalRules());
    }

    public WeekendRules globalRules() {
        GlobalSettings settings = singleton();
        return new WeekendRules(settings.isSaturdayDayOff(), settings.isSundayDayOff());
    }

    @Transactional
    public WeekendRules updateGlobal(boolean saturdayDayOff, boolean sundayDayOff) {
        GlobalSettings settings = singleton();
        settings.update(saturdayDayOff, sundayDayOff);
        globals.save(settings);
        return new WeekendRules(saturdayDayOff, sundayDayOff);
    }

    @Transactional
    public PlatformSettings updatePlatform(Long id, boolean inheritGlobal, boolean saturdayDayOff, boolean sundayDayOff) {
        Platform platform = Objects.requireNonNull(platforms.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found")));
        platform.updateWeekendDaysOff(inheritGlobal ? null : saturdayDayOff, inheritGlobal ? null : sundayDayOff);
        platforms.save(platform);
        return platformSettings(platform, globalRules());
    }

    private GlobalSettings singleton() {
        return Objects.requireNonNull(globals.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Global settings migration has not been applied")));
    }

    private static @NonNull PlatformSettings platformSettings(Platform platform, WeekendRules global) {
        return new PlatformSettings(platform.getId(), platform.getName(), platform.getSaturdayDayOff() == null,
                effectiveRules(platform, global));
    }

    static WeekendRules effectiveRules(@Nullable Platform platform, WeekendRules global) {
        if (platform == null || platform.getSaturdayDayOff() == null) return global;
        return new WeekendRules(Boolean.TRUE.equals(platform.getSaturdayDayOff()), Boolean.TRUE.equals(platform.getSundayDayOff()));
    }

    public record WeekendRules(boolean saturdayDayOff, boolean sundayDayOff) {
        public boolean isDayOff(LocalDate date) {
            return (date.getDayOfWeek().getValue() == 6 && saturdayDayOff)
                    || (date.getDayOfWeek().getValue() == 7 && sundayDayOff);
        }

        public List<@NonNull Integer> daysOff() {
            List<@NonNull Integer> days = new ArrayList<>();
            if (saturdayDayOff) days.add(6);
            if (sundayDayOff) days.add(7);
            return List.copyOf(days);
        }
    }

    public record PlatformSettings(Long id, String name, boolean inheritGlobal, WeekendRules effective) { }
    public record ManagementSettings(WeekendRules global, List<@NonNull PlatformSettings> platforms) { }
}
