package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.auth.AdminAuthorizationService;
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
    private final AdminAuthorizationService authorization;

    public RtoDashboardController(RtoDashboardService dashboardService,
                                  AdminAuthorizationService authorization) {
        this.dashboardService = dashboardService;
        this.authorization = authorization;
    }

    @GetMapping
    @Operation(summary = "Get a Monday-to-Friday RTO summary")
    public RtoDashboardService.WeeklyRtoSummary getWeeklySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weekStart must be a Monday");
        }
        return dashboardService.getWeeklySummary(weekStart);
    }

}
