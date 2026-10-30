package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.NonNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/dashboard/rto")
@Tag(name = "RTO Dashboard", description = "Weekly planned office-day summaries")
public class RtoDashboardController {

    private final RtoDashboardService dashboardService;
    private final AdminAuthorizationService authorization;
    private final RtoDashboardExcelExporter excelExporter;

    public RtoDashboardController(RtoDashboardService dashboardService,
                                  AdminAuthorizationService authorization, RtoDashboardExcelExporter excelExporter) {
        this.dashboardService = dashboardService;
        this.authorization = authorization;
        this.excelExporter = excelExporter;
    }

    @GetMapping
    @Operation(summary = "Get a Monday-to-Friday RTO summary")
    public RtoDashboardService.WeeklyRtoSummary getWeeklySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(required = false) @Min(1) Long siteId,
            HttpServletRequest request) {
        authorization.requireDashboardAccess(request);
        requireMonday(weekStart);
        return dashboardService.getWeeklySummary(weekStart, siteId);
    }

    @GetMapping("/export")
    @Operation(summary = "Export the selected week's summary, linked breakdowns, and raw office-day records to Excel")
    public ResponseEntity<byte[]> export(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(required = false) @Min(1) Long siteId,
            HttpServletRequest request) throws IOException {
        authorization.requireDashboardAccess(request);
        requireMonday(weekStart);
        var report = dashboardService.getWeeklyReport(weekStart, siteId);
        String siteName = report.siteName().replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").strip();
        String filename = "rto-dashboard-" + weekStart + (siteId == null ? "-all-sites" : "-site-" + siteName) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(filename, StandardCharsets.UTF_8).build().toString())
                .cacheControl(CacheControl.noStore())
                .body(excelExporter.export(report));
    }

    private static void requireMonday(LocalDate weekStart) {
        if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weekStart must be a Monday");
        }
    }

    @GetMapping("/sites")
    @Operation(summary = "List Site choices for the RTO dashboard filter")
    public List<RtoDashboardService.@NonNull SiteOption> findSiteOptions(HttpServletRequest request) {
        authorization.requireDashboardAccess(request);
        return dashboardService.findSiteOptions();
    }

}
