package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.office.OfficeDay;
import com.rtotracker.backend.office.OfficeDayRepository;
import com.rtotracker.backend.site.Site;
import com.rtotracker.backend.site.SiteRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RtoDashboardServiceTest {
    @Test
    void siteFilterScopesRawRecordsAndEverySummaryTotalTogether() {
        LocalDate monday = LocalDate.of(2026, 10, 26);
        OfficeDayRepository days = mock(OfficeDayRepository.class);
        UserRepository users = mock(UserRepository.class);
        SiteRepository sites = mock(SiteRepository.class);
        Site north = mock(Site.class);
        when(north.getId()).thenReturn(1L);
        when(north.getName()).thenReturn("North");
        User alice = new User("alice@example.com", "hash");
        alice.setSite(north);
        User bob = new User("bob@example.com", "hash");
        when(sites.findById(1L)).thenReturn(Optional.of(north));
        when(users.findAllById(Objects.requireNonNull(Set.of("alice@example.com", "bob@example.com"))))
                .thenReturn(List.of(alice, bob));
        when(days.findAllByOfficeDateBetweenOrderByOfficeDateAsc(monday, monday.plusDays(4))).thenReturn(List.of(
                new OfficeDay(alice.getEmail(), monday), new OfficeDay(bob.getEmail(), monday),
                new OfficeDay(alice.getEmail(), monday.plusDays(1))));
        var service = new RtoDashboardService(days, users, sites);
        var report = service.getWeeklyReport(monday, 1L);
        assertEquals(2, report.records().size());
        assertTrue(report.records().stream().allMatch(record -> record.email().equals(alice.getEmail())));
        assertEquals("North", report.siteName());
        assertEquals(2, report.summary().totalRtoDays());
        assertEquals(1, report.summary().uniqueAttendees());
        assertEquals(2, report.summary().daily().stream().mapToLong(RtoDashboardService.DailyAttendance::attendees).sum());
        assertEquals(2, report.summary().byPlatform().stream().mapToLong(RtoDashboardService.GroupAttendance::rtoDays).sum());
        assertEquals(2, report.summary().byWorkSchedule().stream().mapToLong(RtoDashboardService.GroupAttendance::rtoDays).sum());
        assertEquals(report.summary(), service.getWeeklySummary(monday, 1L));
        var all = service.getWeeklyReport(monday, null);
        assertEquals(3, all.records().size());
        assertEquals(3, all.summary().totalRtoDays());
        assertEquals(2, all.summary().uniqueAttendees());
    }
}
