package com.rtotracker.backend.office;

import com.rtotracker.backend.user.UserRepository;
import com.rtotracker.backend.settings.SettingsService;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;
import java.util.TreeSet;

@Service
public class OfficeDayService {

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
        OfficeDayQueryResponse schedule = getSchedule(userEmail, month);
        var currentUser = users.findById(userEmail);
        var platform = currentUser.isEmpty() ? null : Objects.requireNonNull(currentUser.get()).getPlatform();
        if (platform == null) {
            return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), List.of(), settings.rulesForUser(userEmail).daysOff());
        }

        List<@NonNull PlatformDailyAttendance> attendance = officeDays.findPlatformAttendance(
                        platform.getId(), userEmail,
                        month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(day -> new PlatformDailyAttendance(day.getOfficeDate(), day.getAttendees()))
                .toList();
        return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), attendance, settings.rulesForUser(userEmail).daysOff());
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

    public record OfficeDayQueryResponse(
            YearMonth month,
            List<@NonNull LocalDate> officeDays) {
    }

    public record MonthlyScheduleQueryResponse(
            YearMonth month,
            List<@NonNull LocalDate> officeDays,
            List<@NonNull PlatformDailyAttendance> platformAttendance,
            List<@NonNull Integer> daysOff) {
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
