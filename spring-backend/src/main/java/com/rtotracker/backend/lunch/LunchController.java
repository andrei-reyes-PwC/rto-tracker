package com.rtotracker.backend.lunch;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@Validated
@RequestMapping("/api/lunch")
@Tag(name = "Lunch", description = "Lock and track daily lunch recipients")
@Transactional
public class LunchController {
    private final LunchDayRepository lunches;
    private final UserRepository users;
    private final AdminAuthorizationService authorization;

    public LunchController(LunchDayRepository lunches, UserRepository users, AdminAuthorizationService authorization) {
        this.lunches = lunches;
        this.users = users;
        this.authorization = authorization;
    }

    @GetMapping("/{date}")
    @Transactional(readOnly = true)
    public LunchDayResponse getDay(@PathVariable LocalDate date, HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        return lunches.findById(date).map(this::responseFor).orElseGet(() -> previewFor(date));
    }

    @PostMapping
    public LunchDayResponse lockDay(@Valid @RequestBody LockLunchRequest body, HttpServletRequest request) {
        User actor = authorization.requireLunchAccess(request);
        if (lunches.existsById(body.date())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lunch is already locked for this date");
        List<String> allUserEmails = users.findAllEmails();
        if (allUserEmails.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There are no users to lock for lunch");
        LunchDay day = new LunchDay(body.date(), actor.getEmail(), allUserEmails);
        try {
            return responseFor(lunches.saveAndFlush(day));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lunch is already locked for this date");
        }
    }

    @PutMapping("/{date}/recipients/{email}/received")
    public LunchDayResponse markReceived(@PathVariable LocalDate date, @PathVariable String email,
                                         @RequestBody ReceivedRequest body, HttpServletRequest request) {
        authorization.requireLunchAccess(request);
        LunchDay day = lunches.findById(date).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lunch is not locked for this date"));
        LunchRecipient recipient = day.getRecipients().stream().filter(item -> item.getUserEmail().equalsIgnoreCase(email)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
        recipient.setReceived(body.received());
        return responseFor(day);
    }

    private LunchDayResponse responseFor(LunchDay day) {
        List<String> emails = day.getRecipients().stream().map(LunchRecipient::getUserEmail).toList();
        Map<String, Boolean> receivedByEmail = day.getRecipients().stream()
                .collect(Collectors.toMap(LunchRecipient::getUserEmail, LunchRecipient::isReceived));
        return new LunchDayResponse(day.getLunchDate(), true, recipientResponses(emails, receivedByEmail));
    }

    private LunchDayResponse previewFor(LocalDate date) {
        return new LunchDayResponse(date, false, recipientResponses(users.findAllEmails(), Map.of()));
    }

    private List<RecipientResponse> recipientResponses(List<String> emails, Map<String, Boolean> receivedByEmail) {
        Map<String, User> userByEmail = users.findAllById(emails).stream()
                .collect(Collectors.toMap(User::getEmail, Function.identity()));
        return emails.stream().map(email -> {
            User user = userByEmail.get(email);
            return new RecipientResponse(email, receivedByEmail.getOrDefault(email, false),
                    user == null || user.getPlatform() == null ? null : user.getPlatform().getName(),
                    user == null || user.getWorkSchedule() == null ? null : user.getWorkSchedule().getName());
        }).toList();
    }

    public record LockLunchRequest(@NotNull LocalDate date) { }
    public record ReceivedRequest(boolean received) { }
    public record RecipientResponse(String email, boolean received, String platform, String workSchedule) { }
    public record LunchDayResponse(LocalDate date, boolean locked, List<RecipientResponse> recipients) {
    }
}
