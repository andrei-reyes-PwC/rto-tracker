package com.rtotracker.backend.lunch;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.site.SiteRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@Validated
@RequestMapping("/api/lunch")
@Tag(name = "Lunch", description = "Preview and lock daily lunch recipients")
@Transactional
public class LunchController {
    private final LunchDayRepository lunches;
    private final LunchRecipientRepository recipients;
    private final UserRepository users;
    private final SiteRepository sites;
    private final AdminAuthorizationService authorization;

    public LunchController(LunchDayRepository lunches, LunchRecipientRepository recipients, UserRepository users,
                           SiteRepository sites, AdminAuthorizationService authorization) {
        this.lunches = lunches;
        this.recipients = recipients;
        this.users = users;
        this.sites = sites;
        this.authorization = authorization;
    }

    @GetMapping("/{date}")
    @Transactional(readOnly = true)
    public LunchSummaryResponse getDay(@PathVariable LocalDate date,
                                       @RequestParam(required = false) @jakarta.validation.constraints.Min(1) Long siteId,
                                       HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        var locked = lunches.findById(new LunchDayId(date, siteScope(siteId)));
        if (locked.isPresent()) {
            LunchDay day = locked.get();
            return summaryFor(date, true, day.getSiteId(), day.getSiteName(), recipientResponses(day).recipients());
        }
        return summaryFor(date, false, siteId, siteName(siteId), previewFor(date, siteId).recipients());
    }

    @GetMapping("/roster/page")
    @Transactional(readOnly = true)
    public RosterPageResponse getRosterPage(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size,
                                            @RequestParam(required = false) @jakarta.validation.constraints.Min(1) Long siteId,
                                            @RequestParam(required = false) String platform,
                                            @RequestParam(required = false) String workSchedule,
                                            @RequestParam(required = false) @Size(max = 254) String search,
                                            HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        if (page < 0 || size < 1 || size > 50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roster page or size");
        Page<User> result = users.findLunchRoster(siteId, platform, workSchedule, normalizeSearch(search),
                PageRequest.of(page, size, Sort.by("email").ascending()));
        return new RosterPageResponse(result.getContent().stream().map(user ->
                new RecipientResponse(user.getEmail(), false, null, user.getSite() == null ? null : user.getSite().getId(),
                        user.getPlatform() == null ? null : user.getPlatform().getName(),
                        user.getWorkSchedule() == null ? null : user.getWorkSchedule().getName())).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @GetMapping("/{date}/roster/page")
    @Transactional(readOnly = true)
    public RosterPageResponse getLockedRosterPage(@PathVariable LocalDate date,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(required = false) @jakarta.validation.constraints.Min(1) Long siteId,
                                                   @RequestParam(required = false) String platform,
                                                   @RequestParam(required = false) String workSchedule,
                                                   @RequestParam(required = false) String status,
                                                   @RequestParam(required = false) @Size(max = 254) String search,
                                                   HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        if (page < 0 || size < 1 || size > 50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roster page or size");
        if (status != null && !status.equals("received") && !status.equals("pending")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be received or pending");
        }
        LunchDay day = lunches.findById(new LunchDayId(date, siteScope(siteId)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lunch is not locked for this date and Site"));
        String emailSearch = normalizeSearch(search);
        List<RecipientResponse> matching = recipientResponses(day).recipients().stream()
                .filter(recipient -> platform == null || platform.equals(recipient.platform() == null ? "No platform" : recipient.platform()))
                .filter(recipient -> workSchedule == null || workSchedule.equals(recipient.workSchedule() == null ? "No work schedule" : recipient.workSchedule()))
                .filter(recipient -> emailSearch == null || recipient.email().toLowerCase(java.util.Locale.ROOT).contains(emailSearch.toLowerCase(java.util.Locale.ROOT)))
                .filter(recipient -> status == null || recipient.received() == status.equals("received"))
                .toList();
        int start = Math.min(page * size, matching.size());
        int end = Math.min(start + size, matching.size());
        return new RosterPageResponse(matching.subList(start, end), page, size, matching.size(), (matching.size() + size - 1) / size);
    }

    @GetMapping("/roster/options")
    @Transactional(readOnly = true)
    public RosterOptionsResponse getRosterOptions(HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        return new RosterOptionsResponse(users.findLunchPlatforms(), users.findLunchWorkSchedules(),
                sites.findAllSummaries("").stream().map(site -> new SiteOption(site.getId(), site.getName())).toList());
    }

    @PostMapping("/{date}/scan")
    public ScanResponse scanCredential(@PathVariable LocalDate date,
                                       @RequestParam(required = false) @jakarta.validation.constraints.Min(1) Long siteId,
                                       @Valid @RequestBody ScanRequest body,
                                       HttpServletRequest request) {
        User actor = authorization.requireLunchAccess(request);
        LunchDay day = lunches.findById(new LunchDayId(date, siteScope(siteId)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lunch is not locked for this date and Site"));
        String credential = body.credential().trim();
        LunchRecipient recipient = day.getRecipients().stream()
                .filter(item -> item.getUserEmail().equalsIgnoreCase(credential)).findFirst().orElse(null);
        if (recipient == null) return new ScanResponse("NOT_ON_LIST", credential, false);
        if (recipient.isReceived()) return new ScanResponse("ALREADY_RECEIVED", recipient.getUserEmail(), true);
        int updated = recipients.markReceivedIfPending(date, siteScope(siteId), recipient.getUserEmail(), actor.getEmail());
        if (updated == 0) return new ScanResponse("ALREADY_RECEIVED", recipient.getUserEmail(), true);
        return new ScanResponse("MARKED_RECEIVED", recipient.getUserEmail(), true);
    }

    @PostMapping
    public LunchSummaryResponse lockDay(@Valid @RequestBody LockLunchRequest body, HttpServletRequest request) {
        User actor = authorization.requireLunchAccess(request);
        LunchDayId id = new LunchDayId(body.date(), siteScope(body.siteId()));
        if (lunches.existsById(new LunchDayId(body.date(), 0L))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A legacy All Sites lunch is already locked for this date");
        }
        if (lunches.existsById(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lunch is already locked for this date and Site");
        String selectedSiteName = siteName(body.siteId());
        List<String> userEmails = users.findLunchEmailsBySiteId(body.siteId());
        if (userEmails.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There are no users to lock for this Site");
        LunchDay day = new LunchDay(body.date(), body.siteId(), selectedSiteName, actor.getEmail(), userEmails);
        try {
            LunchDay saved = lunches.saveAndFlush(day);
            return summaryFor(saved.getLunchDate(), true, saved.getSiteId(), saved.getSiteName(), recipientResponses(saved).recipients());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lunch is already locked for this date and Site");
        }
    }

    private LunchDayResponse recipientResponses(LunchDay day) {
        List<String> emails = day.getRecipients().stream().map(LunchRecipient::getUserEmail).toList();
        Map<String, Boolean> receiptStatusByEmail = day.getRecipients().stream()
                .collect(Collectors.toMap(LunchRecipient::getUserEmail, LunchRecipient::isReceived));
        Map<String, String> handedOutByEmail = new HashMap<>();
        day.getRecipients().forEach(recipient -> {
            if (recipient.getHandedOutBy() != null) handedOutByEmail.put(recipient.getUserEmail(), recipient.getHandedOutBy());
        });
        return new LunchDayResponse(day.getLunchDate(), true, recipientResponses(emails, receiptStatusByEmail, handedOutByEmail));
    }

    private LunchDayResponse previewFor(LocalDate date, Long siteId) {
        return new LunchDayResponse(date, false, recipientResponses(users.findLunchEmailsBySiteId(siteId), Map.of(), Map.of()));
    }

    private LunchSummaryResponse summaryFor(LocalDate date, boolean locked, Long siteId, String siteName, List<RecipientResponse> recipients) {
        Map<String, List<RecipientResponse>> grouped = recipients.stream().collect(Collectors.groupingBy(recipient ->
                (recipient.platform() == null ? "No platform" : recipient.platform()) + "\u0000"
                        + (recipient.workSchedule() == null ? "No work schedule" : recipient.workSchedule())));
        List<BreakdownCount> breakdown = grouped.entrySet().stream().map(entry -> {
            String[] labels = entry.getKey().split("\u0000", 2);
            List<RecipientResponse> members = entry.getValue();
            return new BreakdownCount(labels[0], labels[1], members.size(), (int) members.stream().filter(RecipientResponse::received).count());
        }).sorted(java.util.Comparator.comparing(BreakdownCount::platform).thenComparing(BreakdownCount::workSchedule)).toList();
        return new LunchSummaryResponse(date, locked, siteId, siteName, recipients.size(), (int) recipients.stream().filter(RecipientResponse::received).count(), breakdown);
    }

    private long siteScope(Long siteId) { return siteId == null ? 0L : siteId; }

    private String siteName(Long siteId) {
        if (siteId == null) return null;
        return sites.findById(siteId).map(site -> site.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) return null;
        return search.trim();
    }

    private List<RecipientResponse> recipientResponses(List<String> emails, Map<String, Boolean> receivedByEmail,
                                                       Map<String, String> actorByEmail) {
        Map<String, User> userByEmail = users.findAllById(emails).stream()
                .collect(Collectors.toMap(User::getEmail, Function.identity()));
        return emails.stream().map(email -> {
            User user = userByEmail.get(email);
            return new RecipientResponse(email, receivedByEmail.getOrDefault(email, false), actorByEmail.get(email),
                    user == null || user.getSite() == null ? null : user.getSite().getId(),
                    user == null || user.getPlatform() == null ? null : user.getPlatform().getName(),
                    user == null || user.getWorkSchedule() == null ? null : user.getWorkSchedule().getName());
        }).toList();
    }

    public record LockLunchRequest(@NotNull LocalDate date, @NotNull @jakarta.validation.constraints.Min(1) Long siteId) { }
    public record ScanRequest(@NotBlank @Size(max = 254) String credential) { }
    public record ScanResponse(String status, String email, boolean received) { }
    public record RecipientResponse(String email, boolean received, String handedOutBy, Long siteId, String platform, String workSchedule) { }
    public record LunchDayResponse(LocalDate date, boolean locked, List<RecipientResponse> recipients) {
    }
    public record BreakdownCount(String platform, String workSchedule, int total, int received) { }
    public record LunchSummaryResponse(LocalDate date, boolean locked, Long siteId, String siteName, int totalRecipients, int totalReceived, List<BreakdownCount> breakdown) { }
    public record RosterPageResponse(List<RecipientResponse> recipients, int page, int size, long totalElements, int totalPages) { }
    public record SiteOption(Long id, String name) { }
    public record RosterOptionsResponse(List<String> platforms, List<String> workSchedules, List<SiteOption> sites) { }
}
