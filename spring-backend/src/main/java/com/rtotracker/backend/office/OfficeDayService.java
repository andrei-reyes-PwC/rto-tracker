package com.rtotracker.backend.office;

import com.rtotracker.backend.user.UserRepository;
import com.rtotracker.backend.settings.SettingsService;
import com.rtotracker.backend.settings.SchedulingMode;
import com.rtotracker.backend.platform.Platform;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.TreeSet;

@Service
public class OfficeDayService {

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG)
            .withLocale(Locale.ENGLISH);

    private final OfficeDayRepository officeDays;
    private final UserRepository users;
    private final SettingsService settings;

    public OfficeDayService(OfficeDayRepository officeDays, UserRepository users, SettingsService settings) {
        this.officeDays = officeDays;
        this.users = users;
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public OfficeDayQueryResponse getSchedule(String userEmail, YearMonth month) {
        List<@NonNull LocalDate> personalOfficeDays = officeDays
                .findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                        userEmail, month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(OfficeDay::getOfficeDate)
                .toList();
        return new OfficeDayQueryResponse(month, personalOfficeDays);
    }

    @Transactional(readOnly = true)
    public MonthlyScheduleQueryResponse getMonthlySchedule(String userEmail, YearMonth month) {
        var rules = settings.rulesForUser(userEmail);
        OfficeDayQueryResponse schedule = getSchedule(userEmail, month);
        var currentUser = users.findById(userEmail);
        var platform = currentUser.isEmpty() ? null : Objects.requireNonNull(currentUser.get()).getPlatform();
        if (platform == null) {
            return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), List.of(), rules.daysOff(),
                    rules.schedulingMode(), null);
        }

        List<@NonNull PlatformDailyAttendance> attendance = officeDays.findPlatformAttendance(
                        platform.getId(), userEmail,
                        month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(day -> new PlatformDailyAttendance(day.getOfficeDate(), day.getAttendees()))
                .toList();
        return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), attendance, rules.daysOff(),
                rules.schedulingMode(), dailyCapacity(platform, rules.schedulingMode()));
    }

    @Transactional(readOnly = true)
    public PlatformOfficeDayQueryResponse getPlatformSchedule(String userEmail, LocalDate officeDate) {
        var currentUser = users.findById(userEmail);
        var platform = currentUser.isEmpty() ? null : Objects.requireNonNull(currentUser.get()).getPlatform();
        if (platform == null) {
            return new PlatformOfficeDayQueryResponse(officeDate, null, List.of());
        }

        List<@NonNull PlatformOfficeDay> colleagues = officeDays.findPlatformOfficeDaysForDate(
                        platform.getId(), userEmail, officeDate)
                .stream()
                .map(day -> new PlatformOfficeDay(day.getOfficeDate(), day.getUserEmail()))
                .toList();
        return new PlatformOfficeDayQueryResponse(officeDate, platform.getName(), colleagues);
    }

    @Transactional(readOnly = true)
    public PlatformAttendanceQueryResponse getPlatformAttendance(String userEmail, YearMonth month) {
        var currentUser = users.findById(userEmail);
        var platform = currentUser.isEmpty() ? null : Objects.requireNonNull(currentUser.get()).getPlatform();
        if (platform == null) {
            return new PlatformAttendanceQueryResponse(month, null, List.of());
        }

        List<@NonNull PlatformDailyAttendance> dailyAttendance = officeDays.findPlatformAttendance(
                        platform.getId(), userEmail,
                        month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(day -> new PlatformDailyAttendance(day.getOfficeDate(), day.getAttendees()))
                .toList();
        return new PlatformAttendanceQueryResponse(month, platform.getName(), dailyAttendance);
    }

    @Transactional
    public OfficeDayQueryResponse replaceMonth(String userEmail, YearMonth month, List<@NonNull LocalDate> dates) {
        if (dates.stream().anyMatch(date -> !YearMonth.from(date).equals(month))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Every office date must belong to the requested month");
        }

        settings.lockPlanningWrites();
        LocalDate startInclusive = month.atDay(1);
        LocalDate endExclusive = month.plusMonths(1).atDay(1);
        LocalDate today = LocalDate.now();
        List<@NonNull LocalDate> savedDates = officeDays
                .findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                        userEmail, startInclusive, endExclusive)
                .stream()
                .map(OfficeDay::getOfficeDate)
                .toList();
        List<@NonNull LocalDate> lockedDates = savedDates.stream().filter(date -> !date.isAfter(today)).toList();
        if (dates.stream().anyMatch(date -> !date.isAfter(today) && !lockedDates.contains(date))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Today and past office days cannot be added or changed");
        }

        var rules = settings.rulesForUser(userEmail);
        if (dates.stream().anyMatch(date -> date.isAfter(today) && rules.isDayOff(date) && !savedDates.contains(date))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New office days cannot be selected on configured days off. Reload your schedule to see the current rules.");
        }

        if (rules.schedulingMode() == SchedulingMode.PEZA) {
            var user = Objects.requireNonNull(users.findById(userEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found")));
            var platform = user.getPlatform();
            Long capacity = dailyCapacity(platform, rules.schedulingMode());
            if (platform != null && capacity != null) {
                Map<LocalDate, Long> counts = officeDays.findPlatformAttendance(platform.getId(), userEmail,
                        startInclusive, endExclusive).stream().collect(Collectors.toMap(
                                OfficeDayRepository.PlatformDailyAttendanceProjection::getOfficeDate,
                                OfficeDayRepository.PlatformDailyAttendanceProjection::getAttendees));
                for (LocalDate date : new TreeSet<>(dates)) {
                    if (date.isAfter(today) && !savedDates.contains(date) && counts.getOrDefault(date, 0L) >= capacity) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "PEZA daily capacity is full for " + date.format(DISPLAY_DATE) + " (" + capacity
                                        + " slots). Reload your schedule to see available slots.");
                    }
                }
            }
        }

        LocalDate editableStart = today.plusDays(1).isAfter(startInclusive) ? today.plusDays(1) : startInclusive;
        if (editableStart.isBefore(endExclusive)) {
            officeDays.deleteMonth(userEmail, editableStart, endExclusive);
        }

        List<@NonNull OfficeDay> replacements = new TreeSet<>(dates).stream()
                .filter(date -> date.isAfter(today))
                .map(date -> new OfficeDay(userEmail, date))
                .toList();
        officeDays.saveAll(Objects.requireNonNull(replacements));

        return getSchedule(userEmail, month);
    }

    private @Nullable Long dailyCapacity(@Nullable Platform platform, SchedulingMode mode) {
        if (platform == null || mode != SchedulingMode.PEZA) return null;
        long members = users.countByPlatformId(platform.getId());
        return mode.dailyCapacity(members);
    }

    public record OfficeDayQueryResponse(
            YearMonth month,
            List<@NonNull LocalDate> officeDays) {
    }

    public record MonthlyScheduleQueryResponse(
            YearMonth month,
            List<@NonNull LocalDate> officeDays,
            List<@NonNull PlatformDailyAttendance> platformAttendance,
            List<@NonNull Integer> daysOff,
            SchedulingMode schedulingMode,
            @Nullable Long dailyCapacity) {
    }

    public record PlatformOfficeDayQueryResponse(
            LocalDate date,
            String platformName,
            List<@NonNull PlatformOfficeDay> colleagues) {
    }

    public record PlatformOfficeDay(LocalDate date, String email) {
    }

    public record PlatformDailyAttendance(LocalDate date, long attendees) {
    }

    public record PlatformAttendanceQueryResponse(
            YearMonth month,
            String platformName,
            List<@NonNull PlatformDailyAttendance> attendance) {
    }
}
