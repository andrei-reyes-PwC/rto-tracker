package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.NonNull;
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
import java.util.List;

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
            @RequestParam(required = false) @Min(1) Long siteId,
            HttpServletRequest request) {
        authorization.requireDashboardAccess(request);
        if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weekStart must be a Monday");
        }
        return dashboardService.getWeeklySummary(weekStart, siteId);
    }

    @GetMapping("/sites")
    @Operation(summary = "List Site choices for the RTO dashboard filter")
    public List<RtoDashboardService.@NonNull SiteOption> findSiteOptions(HttpServletRequest request) {
        authorization.requireDashboardAccess(request);
        return dashboardService.findSiteOptions();
    }

}
