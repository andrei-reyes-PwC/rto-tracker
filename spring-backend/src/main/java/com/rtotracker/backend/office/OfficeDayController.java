package com.rtotracker.backend.office;

import com.rtotracker.backend.auth.AuthSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/office-days")
public class OfficeDayController {

    private final OfficeDayService officeDayService;

    public OfficeDayController(OfficeDayService officeDayService) {
        this.officeDayService = officeDayService;
    }

    @GetMapping
    public OfficeDayService.MonthlyScheduleQueryResponse getOfficeDays(
            @RequestParam String month,
            HttpServletRequest request) {
        return officeDayService.getMonthlySchedule(
                AuthSession.requireEmail(request), parseMonth(month));
    }

    @GetMapping("/platform")
    public OfficeDayService.PlatformOfficeDayQueryResponse getPlatformOfficeDays(
            @RequestParam String date,
            HttpServletRequest request) {
        return officeDayService.getPlatformSchedule(
                AuthSession.requireEmail(request), parseDate(date));
    }

    @GetMapping("/platform/attendance")
    public OfficeDayService.PlatformAttendanceQueryResponse getPlatformAttendance(
            @RequestParam String month,
            HttpServletRequest request) {
        return officeDayService.getPlatformAttendance(
                AuthSession.requireEmail(request), parseMonth(month));
    }

    @PutMapping
    public OfficeDayService.OfficeDayQueryResponse replaceMonth(
            @RequestParam String month,
            @Valid @RequestBody ReplaceOfficeDaysRequest requestBody,
            HttpServletRequest request) {
        return officeDayService.replaceMonth(
                AuthSession.requireEmail(request), parseMonth(month), requestBody.dates());
    }

    private YearMonth parseMonth(String value) {
        if (value == null) return null;
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "month must use the YYYY-MM format", exception);
        }
    }

    private LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date must use the YYYY-MM-DD format", exception);
        }
    }

    public record ReplaceOfficeDaysRequest(
            @NotNull @Size(max = 31) List<@NonNull @NotNull LocalDate> dates) {
    }
}
