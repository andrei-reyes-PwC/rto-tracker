package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.auth.AuthSession;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;

@RestController
@Validated
@RequestMapping("/api/dashboard/rto")
@Tag(name = "RTO Dashboard", description = "Weekly planned office-day summaries")
public class RtoDashboardController {

    private final RtoDashboardService dashboardService;
    private final UserService userService;

    public RtoDashboardController(RtoDashboardService dashboardService, UserService userService) {
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get a Monday-to-Friday RTO summary")
    public RtoDashboardService.WeeklyRtoSummary getWeeklySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            HttpServletRequest request) {
        requireSuperAdmin(request);
        if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weekStart must be a Monday");
        }
        return dashboardService.getWeeklySummary(weekStart);
    }

    private User requireSuperAdmin(HttpServletRequest request) {
        User user = userService.findByEmail(AuthSession.requireEmail(request));
        if (user.getRoles().stream().map(Role::getCode).noneMatch("SUPER_ADMIN"::equals)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN access required");
        }
        return user;
    }
}
