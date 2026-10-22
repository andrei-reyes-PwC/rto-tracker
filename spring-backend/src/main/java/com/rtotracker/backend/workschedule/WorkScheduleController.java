package com.rtotracker.backend.workschedule;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/work-schedules")
@Tag(name = "Work Schedules", description = "Create and manage reusable work schedules")
public class WorkScheduleController {

    private final WorkScheduleService workScheduleService;
    private final AdminAuthorizationService authorization;

    public WorkScheduleController(WorkScheduleService workScheduleService, AdminAuthorizationService authorization) {
        this.workScheduleService = workScheduleService;
        this.authorization = authorization;
    }

    @GetMapping
    @Operation(summary = "List work schedules")
    public List<WorkScheduleSummary> findAll(@RequestParam(defaultValue = "") String search, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return workScheduleService.findAllSummaries(search).stream()
                .map(schedule -> new WorkScheduleSummary(schedule.getId(), schedule.getName(), schedule.getUserCount()))
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a work schedule and its users")
    public WorkScheduleResponse findById(@PathVariable Long id, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return WorkScheduleResponse.from(workScheduleService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a work schedule")
    public ResponseEntity<WorkScheduleResponse> create(@Valid @RequestBody WorkScheduleRequest request,
                                                       HttpServletRequest servletRequest) {
        authorization.requireSuperAdmin(servletRequest);
        WorkScheduleResponse created = WorkScheduleResponse.from(
                workScheduleService.create(request.name(), request.userEmails()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a work schedule and its users")
    public WorkScheduleResponse update(@PathVariable Long id, @Valid @RequestBody WorkScheduleRequest request,
                                      HttpServletRequest servletRequest) {
        authorization.requireSuperAdmin(servletRequest);
        return WorkScheduleResponse.from(workScheduleService.update(id, request.name(), request.userEmails()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a work schedule")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        workScheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record WorkScheduleRequest(@NotBlank @Size(max = 10) String name,
                                      @NotNull List<@NotBlank @Size(max = 254) String> userEmails) {
    }

    public record WorkScheduleSummary(Long id, String name, long userCount) {
    }

    public record WorkScheduleResponse(Long id, String name, List<String> userEmails) {
        static WorkScheduleResponse from(WorkSchedule schedule) {
            return new WorkScheduleResponse(schedule.getId(), schedule.getName(), schedule.getUsers().stream()
                    .map(User::getEmail).sorted().toList());
        }
    }
}
