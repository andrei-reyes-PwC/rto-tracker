package com.rtotracker.backend.event;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.auth.AuthSession;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/events")
@Tag(name = "Events", description = "Manage global and platform events")
@Transactional
public class EventController {
    private final EventRepository events;
    private final PlatformRepository platforms;
    private final UserService users;
    private final AdminAuthorizationService authorization;

    public EventController(EventRepository events, PlatformRepository platforms, UserService users, AdminAuthorizationService authorization) {
        this.events = events; this.platforms = platforms; this.users = users; this.authorization = authorization;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<EventResponse> visible(@RequestParam String month, HttpServletRequest request) {
        LocalDate start = monthStart(month);
        String email = AuthSession.requireEmail(request);
        User user = users.findByEmail(email);
        List<Event> result = user.getPlatform() == null
                ? events.findGlobalEvents(start, start.plusMonths(1))
                : events.findVisibleEvents(start, start.plusMonths(1), user.getPlatform().getId());
        return result.stream().map(EventResponse::from).toList();
    }

    @GetMapping("/manage")
    @Transactional(readOnly = true)
    public List<EventResponse> findAll(@RequestParam(defaultValue = "") String search,
                                       @RequestParam(required = false) LocalDate date,
                                       HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        return events.findAllWithPlatform(search.trim().toLowerCase(), date).stream().map(EventResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventRequest body, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        Event saved = events.save(new Event(body.date(), normalize(body.title()), normalize(body.kind()),
                normalize(body.time()), normalize(body.place()), body.required(), body.scope(), findPlatform(body)));
        return ResponseEntity.status(HttpStatus.CREATED).body(EventResponse.from(saved));
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable Long id, @Valid @RequestBody EventRequest body, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        Event event = events.findWithPlatformById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        event.update(body.date(), normalize(body.title()), normalize(body.kind()), normalize(body.time()),
                normalize(body.place()), body.required(), body.scope(), findPlatform(body));
        return EventResponse.from(event);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        authorization.requireSuperAdmin(request);
        if (!events.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        events.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Platform findPlatform(EventRequest body) {
        if ("GLOBAL".equals(body.scope())) {
            if (body.platformId() != null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Global events cannot have a platform");
            return null;
        }
        if (!"PLATFORM".equals(body.scope()) || body.platformId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a platform for platform-scoped events");
        }
        return platforms.findById(body.platformId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));
    }

    private static LocalDate monthStart(String month) {
        try { return LocalDate.parse(month + "-01"); }
        catch (RuntimeException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must use YYYY-MM format"); }
    }
    private static String normalize(String value) { return value.trim(); }

    public record EventRequest(@NotNull LocalDate date, @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 40) String kind, @NotBlank @Size(max = 30) String time,
            @NotBlank @Size(max = 120) String place, boolean required, @NotBlank String scope, Long platformId) { }
    public record EventResponse(Long id, LocalDate date, String title, String kind, String time, String place,
            boolean required, String scope, Long platformId, String platformName) {
        static EventResponse from(Event event) {
            return new EventResponse(event.getId(), event.getDate(), event.getTitle(), event.getKind(), event.getTime(),
                    event.getPlace(), event.isRequired(), event.getScope(), event.getPlatform() == null ? null : event.getPlatform().getId(),
                    event.getPlatform() == null ? null : event.getPlatform().getName());
        }
    }
}
