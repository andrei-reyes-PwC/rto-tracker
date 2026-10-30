package com.rtotracker.backend.assistant;

import com.rtotracker.backend.auth.AssistantJwtService;
import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NonNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/assistant/tools")
public class AssistantController {

    private final AssistantService assistantService;
    private final AssistantJwtService assistantJwtService;

    public AssistantController(AssistantService assistantService, AssistantJwtService assistantJwtService) {
        this.assistantService = assistantService;
        this.assistantJwtService = assistantJwtService;
    }

    @GetMapping("/events")
    public EventsResponse events(
            @NotBlank @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String email = assistantJwtService.requireUserEmail(authorization);
        return new EventsResponse(startDate, endDate,
                assistantService.visibleEventsForUser(email, startDate, endDate));
    }

    @GetMapping("/rto-member-counts")
    public MemberCountsResponse rtoMemberCounts(
            @NotBlank @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String email = assistantJwtService.requireUserEmail(authorization);
        return new MemberCountsResponse(startDate, endDate,
                assistantService.rtoMemberCountsForUser(email, startDate, endDate));
    }

    @GetMapping("/my-schedule")
    public ScheduleResponse mySchedule(
            @NotBlank @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String email = assistantJwtService.requireUserEmail(authorization);
        return new ScheduleResponse(startDate, endDate,
                assistantService.myOfficeSchedule(email, startDate, endDate), assistantService.daysOffForUser(email));
    }

    public record EventsResponse(LocalDate startDate, LocalDate endDate,
                                 List<AssistantService.@NonNull EventData> events) { }

    public record MemberCountsResponse(LocalDate startDate, LocalDate endDate,
                                       List<AssistantService.@NonNull MemberCount> dailyCounts) { }

    public record ScheduleResponse(LocalDate startDate, LocalDate endDate,
                                   List<AssistantService.@NonNull ScheduledDay> officeDays,
                                   List<@NonNull Integer> daysOff) { }
}
