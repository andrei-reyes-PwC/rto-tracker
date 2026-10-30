package com.rtotracker.backend.office;

import com.rtotracker.backend.settings.SettingsService;
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
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.WeekendRules(true, true));
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
        when(settings.rulesForUser(email)).thenReturn(new SettingsService.WeekendRules(false, true));
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
}
