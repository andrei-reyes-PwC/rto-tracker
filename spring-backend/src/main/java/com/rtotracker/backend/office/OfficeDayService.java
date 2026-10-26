package com.rtotracker.backend.office;

import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.TreeSet;

@Service
public class OfficeDayService {

    private final OfficeDayRepository officeDays;
    private final UserRepository users;

    public OfficeDayService(OfficeDayRepository officeDays, UserRepository users) {
        this.officeDays = officeDays;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public OfficeDayQueryResponse getSchedule(String userEmail, YearMonth month) {
        List<LocalDate> personalOfficeDays = officeDays
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
        User currentUser = users.findById(userEmail).orElse(null);
        if (currentUser == null || currentUser.getPlatform() == null) {
            return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), List.of());
        }

        List<PlatformDailyAttendance> attendance = officeDays.findPlatformAttendance(
                        currentUser.getPlatform().getId(), userEmail,
                        month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(day -> new PlatformDailyAttendance(day.getOfficeDate(), day.getAttendees()))
                .toList();
        return new MonthlyScheduleQueryResponse(month, schedule.officeDays(), attendance);
    }

    @Transactional(readOnly = true)
    public PlatformOfficeDayQueryResponse getPlatformSchedule(String userEmail, LocalDate officeDate) {
        User currentUser = users.findById(userEmail).orElse(null);
        if (currentUser == null || currentUser.getPlatform() == null) {
            return new PlatformOfficeDayQueryResponse(officeDate, null, List.of());
        }

        List<PlatformOfficeDay> colleagues = officeDays.findPlatformOfficeDaysForDate(
                        currentUser.getPlatform().getId(), userEmail, officeDate)
                .stream()
                .map(day -> new PlatformOfficeDay(day.getOfficeDate(), day.getUserEmail()))
                .toList();
        return new PlatformOfficeDayQueryResponse(officeDate, currentUser.getPlatform().getName(), colleagues);
    }

    @Transactional(readOnly = true)
    public PlatformAttendanceQueryResponse getPlatformAttendance(String userEmail, YearMonth month) {
        User currentUser = users.findById(userEmail).orElse(null);
        if (currentUser == null || currentUser.getPlatform() == null) {
            return new PlatformAttendanceQueryResponse(month, null, List.of());
        }

        List<PlatformDailyAttendance> dailyAttendance = officeDays.findPlatformAttendance(
                        currentUser.getPlatform().getId(), userEmail,
                        month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(day -> new PlatformDailyAttendance(day.getOfficeDate(), day.getAttendees()))
                .toList();
        return new PlatformAttendanceQueryResponse(month, currentUser.getPlatform().getName(), dailyAttendance);
    }

    @Transactional
    public OfficeDayQueryResponse replaceMonth(String userEmail, YearMonth month, List<LocalDate> dates) {
        if (dates.stream().anyMatch(date -> !YearMonth.from(date).equals(month))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Every office date must belong to the requested month");
        }

        LocalDate startInclusive = month.atDay(1);
        LocalDate endExclusive = month.plusMonths(1).atDay(1);
        LocalDate today = LocalDate.now();
        List<LocalDate> lockedDates = officeDays
                .findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                        userEmail, startInclusive, endExclusive)
                .stream()
                .map(OfficeDay::getOfficeDate)
                .filter(date -> !date.isAfter(today))
                .toList();
        if (dates.stream().anyMatch(date -> !date.isAfter(today) && !lockedDates.contains(date))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Today and past office days cannot be added or changed");
        }

        LocalDate editableStart = today.plusDays(1).isAfter(startInclusive) ? today.plusDays(1) : startInclusive;
        if (editableStart.isBefore(endExclusive)) {
            officeDays.deleteMonth(userEmail, editableStart, endExclusive);
        }

        List<OfficeDay> replacements = new TreeSet<>(dates).stream()
                .filter(date -> date.isAfter(today))
                .map(date -> new OfficeDay(userEmail, date))
                .toList();
        officeDays.saveAll(replacements);

        return getSchedule(userEmail, month);
    }

    public record OfficeDayQueryResponse(
            YearMonth month,
            List<LocalDate> officeDays) {
    }

    public record MonthlyScheduleQueryResponse(
            YearMonth month,
            List<LocalDate> officeDays,
            List<PlatformDailyAttendance> platformAttendance) {
    }

    public record PlatformOfficeDayQueryResponse(
            LocalDate date,
            String platformName,
            List<PlatformOfficeDay> colleagues) {
    }

    public record PlatformOfficeDay(LocalDate date, String email) {
    }

    public record PlatformDailyAttendance(LocalDate date, long attendees) {
    }

    public record PlatformAttendanceQueryResponse(
            YearMonth month,
            String platformName,
            List<PlatformDailyAttendance> attendance) {
    }
}
