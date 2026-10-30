package com.rtotracker.backend.office;

import com.rtotracker.backend.settings.SettingsService;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.jspecify.annotations.NonNull;
import org.mockito.ArgumentMatchers;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static com.rtotracker.backend.settings.SchedulingMode.*;

class OfficeDayServiceTest {
    private final OfficeDayRepository days = mock(OfficeDayRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final SettingsService settings = mock(SettingsService.class);
    private final OfficeDayService service = new OfficeDayService(days, users, settings);
    private final String email = "person@example.com";
    private final @NonNull LocalDate saturday = Objects.requireNonNull(LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.SATURDAY)));
    private final YearMonth month = YearMonth.from(saturday);

    @BeforeEach
    void setup() {
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.PlanningRules(true, true, FLEXIBLE));
        when(days.findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(eq(email), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    void rejectsNewDayOffBeforeDeletingAnySavedPlans() {
        var error = assertThrows(ResponseStatusException.class, () -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        assertEquals(400, error.getStatusCode().value());
        verify(days, never()).deleteMonth(any(), any(), any());
        verify(days, never()).saveAll(ArgumentMatchers.<@NonNull List<@NonNull OfficeDay>>any());
    }

    @Test
    void existingSavedDayOffCanBeRetainedOrRemoved() {
        when(days.findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(eq(email), any(), any()))
                .thenReturn(List.of(new OfficeDay(email, saturday)));
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.of()));
        verify(days, times(2)).deleteMonth(eq(email), any(), any());
    }

    @Test
    void permitsWeekendWhenEffectiveRuleIsOffAndExposesRulesWithMonthlyRead() {
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.PlanningRules(false, true, FLEXIBLE));
        when(users.findById(email)).thenReturn(Optional.of(new User(email, "hash")));
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        assertEquals(List.of(7), service.getMonthlySchedule(email, month).daysOff());
    }

    @Test
    void stillPreservesPastDatesAndRejectsNewLockedOrOutOfMonthDates() {
        LocalDate past = LocalDate.now().minusDays(1);
        var pastMonth = YearMonth.from(past);
        when(days.findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                email, pastMonth.atDay(1), pastMonth.plusMonths(1).atDay(1))).thenReturn(List.of(new OfficeDay(email, past)));
        assertDoesNotThrow(() -> service.replaceMonth(email, pastMonth, List.of()));
        assertThrows(ResponseStatusException.class, () -> service.replaceMonth(email, pastMonth,
                List.<@NonNull LocalDate>of(Objects.requireNonNull(LocalDate.now()))));
        assertThrows(ResponseStatusException.class, () -> service.replaceMonth(email, month,
                List.<@NonNull LocalDate>of(Objects.requireNonNull(saturday.plusMonths(1)))));
    }

    private void pezaPlatform(long members, long booked) {
        var platform = mock(Platform.class);
        when(platform.getId()).thenReturn(2L);
        var user = new User(email, "hash");
        user.setPlatform(platform);
        when(users.findById(email)).thenReturn(Optional.of(user));
        when(users.countByPlatformId(2L)).thenReturn(members);
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.PlanningRules(false, false, PEZA));
        var attendance = mock(OfficeDayRepository.PlatformDailyAttendanceProjection.class);
        when(attendance.getOfficeDate()).thenReturn(saturday);
        when(attendance.getAttendees()).thenReturn(booked);
        when(days.findPlatformAttendance(2L, email, month.atDay(1), month.plusMonths(1).atDay(1)))
                .thenReturn(List.of(attendance));
    }

    @Test
    void pezaCapacityRoundsUpAndKeepsColleagueCountsSeparateFromOwnBooking() {
        pezaPlatform(5, 2);
        when(days.findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(eq(email), any(), any()))
                .thenReturn(List.of(new OfficeDay(email, saturday)));
        var result = service.getMonthlySchedule(email, month);
        assertEquals(PEZA, result.schedulingMode());
        assertEquals(3L, result.dailyCapacity());
        assertEquals(2, result.platformAttendance().getFirst().attendees());
        assertEquals(List.of(saturday), result.officeDays());
        when(users.countByPlatformId(2L)).thenReturn(10L);
        assertEquals(5L, service.getMonthlySchedule(email, month).dailyCapacity());
        when(users.countByPlatformId(2L)).thenReturn(1L);
        assertEquals(1L, service.getMonthlySchedule(email, month).dailyCapacity());
    }

    @Test
    void pezaRejectsFullDateBeforeChangingAnyPlansAndLocksBeforeReading() {
        pezaPlatform(10, 5);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        assertEquals(409, error.getStatusCode().value());
        assertTrue(Objects.requireNonNull(error.getReason()).contains(
                saturday.format(DateTimeFormatter.ofPattern("MMMM d, uuuu", Locale.ENGLISH))));
        verify(days, never()).deleteMonth(any(), any(), any());
        verify(days, never()).saveAll(ArgumentMatchers.<@NonNull List<@NonNull OfficeDay>>any());
        var order = inOrder(settings, days);
        order.verify(settings).lockPlanningWrites();
        order.verify(days).findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                email, month.atDay(1), month.plusMonths(1).atDay(1));
    }

    @Test
    void pezaAllowsLastSlotAndExistingOverCapacityBookingsCanBeRetainedOrRemoved() {
        pezaPlatform(5, 2);
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday, saturday)));
        verify(days).saveAll(argThat(records -> {
            var selected = new java.util.ArrayList<OfficeDay>();
            records.forEach(selected::add);
            return selected.size() == 1 && selected.getFirst().getOfficeDate().equals(saturday);
        }));
        pezaPlatform(5, 4);
        when(days.findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(eq(email), any(), any()))
                .thenReturn(List.of(new OfficeDay(email, saturday)));
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.of()));
    }

    @Test
    void flexibleAndUnassignedUsersHaveNoPlatformCapacityLimit() {
        pezaPlatform(10, 10);
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.PlanningRules(false, false, FLEXIBLE));
        assertNull(service.getMonthlySchedule(email, month).dailyCapacity());
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
        when(users.findById(email)).thenReturn(Optional.of(new User(email, "hash")));
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.PlanningRules(false, false, PEZA));
        assertNull(service.getMonthlySchedule(email, month).dailyCapacity());
        assertDoesNotThrow(() -> service.replaceMonth(email, month, List.<@NonNull LocalDate>of(saturday)));
    }
}
