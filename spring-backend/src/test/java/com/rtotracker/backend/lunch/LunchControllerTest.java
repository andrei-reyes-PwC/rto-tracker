package com.rtotracker.backend.lunch;

import com.rtotracker.backend.auth.AdminAuthorizationService;
import com.rtotracker.backend.site.SiteRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LunchControllerTest {
    private final LunchDayRepository lunches = mock(LunchDayRepository.class);
    private final LunchRecipientRepository recipients = mock(LunchRecipientRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final SiteRepository sites = mock(SiteRepository.class);
    private final AdminAuthorizationService authorization = mock(AdminAuthorizationService.class);
    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final LocalDate date = LocalDate.of(2026, 10, 30);
    private final LunchDayId id = new LunchDayId(date, 1L);
    private final @NonNull LunchDay day = new LunchDay(date, 1L, "Main Office", "operator@example.com", List.of("original@example.com"));
    private final LunchController controller = new LunchController(lunches, recipients, users, sites, authorization);

    @BeforeEach
    void setup() {
        when(authorization.requireLunchAccess(request)).thenReturn(new User("operator@example.com", "hash"));
        when(lunches.findForScanById(id)).thenReturn(Optional.of(day));
        when(lunches.findById(id)).thenReturn(Optional.of(day));
        when(recipients.saveAndFlush(any(LunchRecipient.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void acceptsAnUnscheduledUserWithoutSiteAssignmentAndPreservesOriginalList() {
        when(users.findByEmailIgnoreCase("WALKIN@example.com")).thenReturn(Optional.of(new User("walkin@example.com", "hash")));

        Instant before = Instant.now().truncatedTo(ChronoUnit.MICROS);
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("  WALKIN@example.com  "), request);

        assertEquals("MARKED_RECEIVED", result.status());
        assertEquals("walkin@example.com", result.email());
        assertTrue(result.received());
        assertFalse(result.originalList());
        ArgumentCaptor<@NonNull LunchRecipient> saved = ArgumentCaptor.forClass(LunchRecipient.class);
        verify(recipients).saveAndFlush(saved.capture());
        assertFalse(saved.getValue().isOriginalList());
        assertTrue(saved.getValue().isReceived());
        assertEquals("operator@example.com", saved.getValue().getHandedOutBy());
        Instant claimedAt = Objects.requireNonNull(saved.getValue().getClaimedAt());
        assertFalse(claimedAt.isBefore(before));
        assertFalse(claimedAt.isAfter(Instant.now()));
        assertTrue(day.getRecipients().getFirst().isOriginalList());
        verify(lunches).findForScanById(id);
    }

    @Test
    void acceptsAUserAssignedToAnotherSiteAtTheSelectedHandoutSite() {
        User user = new User("visitor@example.com", "hash");
        user.setSite(new com.rtotracker.backend.site.Site("Other Office"));
        when(users.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest(user.getEmail()), request);
        assertTrue(result.received());
        assertFalse(result.originalList());
        verify(recipients).saveAndFlush(any(LunchRecipient.class));
    }

    @Test
    void repeatScanOfAdditionalRecipientDoesNotCreateAnotherHandout() {
        when(users.findByEmailIgnoreCase("walkin@example.com")).thenReturn(Optional.of(new User("walkin@example.com", "hash")));
        controller.scanCredential(date, 1L, new LunchController.ScanRequest("walkin@example.com"), request);
        Instant firstClaim = day.getRecipients().getLast().getClaimedAt();
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("WALKIN@example.com"), request);
        assertEquals("ALREADY_RECEIVED", result.status());
        assertFalse(result.originalList());
        assertEquals(2, day.getRecipients().size());
        assertEquals(firstClaim, day.getRecipients().getLast().getClaimedAt());
        verify(recipients, times(1)).saveAndFlush(any(LunchRecipient.class));
        verify(recipients, never()).markReceivedIfPending(any(), any(), any(), any(), any());
    }

    @Test
    void originalRecipientUsesAtomicReceiptUpdateAndKeepsOriginalStatus() {
        when(recipients.markReceivedIfPending(eq(date), eq(1L), eq("original@example.com"), eq("operator@example.com"), any(Instant.class))).thenReturn(1);
        Instant before = Instant.now().truncatedTo(ChronoUnit.MICROS);
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("ORIGINAL@example.com"), request);
        assertEquals("MARKED_RECEIVED", result.status());
        assertTrue(result.originalList());
        ArgumentCaptor<@NonNull Instant> claimedAt = ArgumentCaptor.forClass(Instant.class);
        verify(recipients).markReceivedIfPending(eq(date), eq(1L), eq("original@example.com"), eq("operator@example.com"), claimedAt.capture());
        assertFalse(claimedAt.getValue().isBefore(before));
        assertFalse(claimedAt.getValue().isAfter(Instant.now()));
        verify(recipients, never()).saveAndFlush(any(LunchRecipient.class));
        verifyNoInteractions(users);
    }

    @Test
    void concurrentOriginalReceiptIsReportedAsAlreadyReceived() {
        when(recipients.markReceivedIfPending(eq(date), eq(1L), eq("original@example.com"), eq("operator@example.com"), any(Instant.class))).thenReturn(0);
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("original@example.com"), request);
        assertEquals("ALREADY_RECEIVED", result.status());
        assertTrue(result.originalList());
    }

    @Test
    void repeatScanOfOriginalRecipientPreservesClaimTimeAndOperator() {
        Instant firstClaim = Instant.parse("2026-10-30T04:15:22Z");
        LunchRecipient original = mock(LunchRecipient.class);
        when(original.getUserEmail()).thenReturn("original@example.com");
        when(original.isReceived()).thenReturn(true);
        when(original.isOriginalList()).thenReturn(true);
        when(original.getClaimedAt()).thenReturn(firstClaim);
        when(original.getHandedOutBy()).thenReturn("first-operator@example.com");
        day.getRecipients().set(0, original);

        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("original@example.com"), request);
        assertEquals("ALREADY_RECEIVED", result.status());
        var roster = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, null, null, null, request);
        assertEquals(firstClaim, roster.recipients().getFirst().claimedAt());
        assertEquals("first-operator@example.com", roster.recipients().getFirst().handedOutBy());
        verifyNoInteractions(recipients);
    }

    @Test
    void legacyReceiptWithoutClaimTimeRemainsUnknownAfterRepeatScan() {
        LunchRecipient legacy = mock(LunchRecipient.class);
        when(legacy.getUserEmail()).thenReturn("original@example.com");
        when(legacy.isReceived()).thenReturn(true);
        when(legacy.isOriginalList()).thenReturn(true);
        day.getRecipients().set(0, legacy);

        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("original@example.com"), request);
        assertEquals("ALREADY_RECEIVED", result.status());
        var roster = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, null, null, null, request);
        assertTrue(roster.recipients().getFirst().received());
        assertNull(roster.recipients().getFirst().claimedAt());
        verifyNoInteractions(recipients);
    }

    @Test
    void unknownEmailDoesNotCreateARecipient() {
        when(users.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());
        var result = controller.scanCredential(date, 1L, new LunchController.ScanRequest("unknown@example.com"), request);
        assertEquals("USER_NOT_FOUND", result.status());
        assertFalse(result.received());
        assertEquals(1, day.getRecipients().size());
        verifyNoInteractions(recipients);
    }

    @Test
    void unlockedSiteDateCannotReceiveLunch() {
        when(lunches.findForScanById(id)).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class, () -> controller.scanCredential(date, 1L,
                new LunchController.ScanRequest("walkin@example.com"), request));
        assertEquals(404, error.getStatusCode().value());
        verifyNoInteractions(users, recipients);
    }

    @Test
    void summaryAndRosterDistinguishOriginalAndAdditionalRecipientsIncludingNewGroups() {
        day.getRecipients().add(LunchRecipient.additionalReceived(day, "walkin@example.com", "operator@example.com"));
        User original = new User("original@example.com", "hash");
        original.setPlatform(new com.rtotracker.backend.platform.Platform("Original platform"));
        User walkin = new User("walkin@example.com", "hash");
        when(users.findAllById(Objects.requireNonNull(List.of("original@example.com", "walkin@example.com")))).thenReturn(List.of(original, walkin));

        var summary = controller.getDay(date, 1L, request);
        assertEquals(2, summary.totalRecipients());
        assertEquals(1, summary.totalReceived());
        assertEquals(1, summary.originalTotal());
        assertEquals(1, summary.additionalReceived());
        assertEquals(2, summary.breakdown().size());
        var addedGroup = Objects.requireNonNull(summary.breakdown().stream().filter(group -> group.platform().equals("No platform")).findFirst().orElseThrow());
        assertEquals(0, addedGroup.originalTotal());
        assertEquals(1, addedGroup.additionalReceived());
        assertEquals(1, addedGroup.received());
        var originalGroup = Objects.requireNonNull(summary.breakdown().stream().filter(group -> group.platform().equals("Original platform")).findFirst().orElseThrow());
        assertEquals(1, originalGroup.originalTotal());
        assertEquals(0, originalGroup.additionalReceived());
        assertEquals(0, originalGroup.received());

        var roster = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, null, null, null, request);
        assertTrue(roster.recipients().getFirst().originalList());
        assertNull(roster.recipients().getFirst().claimedAt());
        assertFalse(roster.recipients().getLast().originalList());
        assertEquals("operator@example.com", roster.recipients().getLast().handedOutBy());
        assertEquals(day.getRecipients().getLast().getClaimedAt(), roster.recipients().getLast().claimedAt());
        var received = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, "received", null, null, request);
        assertEquals(1, received.totalElements());
        assertFalse(received.recipients().getFirst().originalList());
    }

    @Test
    void originalListFilterAppliesBeforePaginationAndCanBeCleared() {
        day.getRecipients().add(LunchRecipient.additionalReceived(day, "walkin1@example.com", "operator@example.com"));
        day.getRecipients().add(LunchRecipient.additionalReceived(day, "walkin2@example.com", "operator@example.com"));
        var original = controller.getLockedRosterPage(date, 0, 1, 1L, null, null, null, true, null, request);
        assertEquals(1, original.totalElements());
        assertEquals(1, original.totalPages());
        assertEquals("original@example.com", original.recipients().getFirst().email());

        var additional = controller.getLockedRosterPage(date, 1, 1, 1L, null, null, null, false, null, request);
        assertEquals(2, additional.totalElements());
        assertEquals(2, additional.totalPages());
        assertEquals("walkin2@example.com", additional.recipients().getFirst().email());
        assertFalse(additional.recipients().getFirst().originalList());

        var all = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, null, null, null, request);
        assertEquals(3, all.totalElements());
    }

    @Test
    void originalListFilterCombinesWithExistingRosterFilters() {
        day.getRecipients().add(LunchRecipient.additionalReceived(day, "walkin@example.com", "operator@example.com"));
        User original = new User("original@example.com", "hash");
        User walkin = new User("walkin@example.com", "hash");
        walkin.setPlatform(new com.rtotracker.backend.platform.Platform("Visitors"));
        walkin.setWorkSchedule(new com.rtotracker.backend.workschedule.WorkSchedule("Day"));
        when(users.findAllById(Objects.requireNonNull(List.of("original@example.com", "walkin@example.com")))).thenReturn(List.of(original, walkin));

        var matching = controller.getLockedRosterPage(date, 0, 10, 1L, "Visitors", "Day", "received", false, "WALKIN", request);
        assertEquals(1, matching.totalElements());
        assertEquals("walkin@example.com", matching.recipients().getFirst().email());
        var originalOnly = controller.getLockedRosterPage(date, 0, 10, 1L, "Visitors", "Day", "received", true, "WALKIN", request);
        assertEquals(0, originalOnly.totalElements());
        var pending = controller.getLockedRosterPage(date, 0, 10, 1L, null, null, "pending", false, null, request);
        assertEquals(0, pending.totalElements());
    }
}
