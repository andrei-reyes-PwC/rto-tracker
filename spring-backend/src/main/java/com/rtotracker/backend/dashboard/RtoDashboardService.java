package com.rtotracker.backend.dashboard;

import com.rtotracker.backend.office.OfficeDay;
import com.rtotracker.backend.office.OfficeDayRepository;
import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.site.Site;
import com.rtotracker.backend.site.SiteRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import com.rtotracker.backend.workschedule.WorkSchedule;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

@Service
public class RtoDashboardService {

    private final OfficeDayRepository officeDays;
    private final UserRepository users;
    private final SiteRepository sites;

    public RtoDashboardService(OfficeDayRepository officeDays, UserRepository users, SiteRepository sites) {
        this.officeDays = officeDays;
        this.users = users;
        this.sites = sites;
    }

    @Transactional(readOnly = true)
    public List<@NonNull SiteOption> findSiteOptions() {
        return sites.findAllSummaries("").stream()
                .map(site -> new SiteOption(site.getId(), site.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public WeeklyRtoSummary getWeeklySummary(LocalDate weekStart, Long siteId) {
        return getWeeklyReport(weekStart, siteId).summary();
    }

    @Transactional(readOnly = true)
    public WeeklyRtoReport getWeeklyReport(LocalDate weekStart, Long siteId) {
        LocalDate weekEnd = weekStart.plusDays(4);
        List<@NonNull OfficeDay> plannedDays = officeDays.findAllByOfficeDateBetweenOrderByOfficeDateAsc(weekStart, weekEnd);
        Set<String> emails = new HashSet<>();
        plannedDays.forEach(day -> emails.add(day.getUserEmail()));
        Map<String, User> userByEmail = new HashMap<>();
        users.findAllById(emails).forEach(user -> userByEmail.put(user.getEmail(), user));

        Map<LocalDate, Set<@NonNull String>> dailyAttendees = new LinkedHashMap<>();
        for (int day = 0; day < 5; day++) dailyAttendees.put(weekStart.plusDays(day), new HashSet<>());
        Set<@NonNull String> weeklyAttendees = new HashSet<>();
        Map<GroupKey, GroupAccumulator> platforms = new HashMap<>();
        Map<GroupKey, GroupAccumulator> workSchedules = new HashMap<>();
        List<@NonNull AttendanceRecord> records = new ArrayList<>();
        String siteName = siteId == null ? "All Sites" : sites.findById(siteId)
                .map(Site::getName).orElse("Selected Site");

        for (OfficeDay plannedDay : plannedDays) {
            @NonNull String email = plannedDay.getUserEmail();
            User user = userByEmail.get(email);
            if (siteId != null && (user == null || user.getSite() == null
                    || !siteId.equals(user.getSite().getId()))) {
                continue;
            }
            dailyAttendees.get(plannedDay.getOfficeDate()).add(email);
            weeklyAttendees.add(email);

            Platform platform = user == null ? null : user.getPlatform();
            GroupKey platformKey = platform == null
                    ? new GroupKey(null, "No platform")
                    : new GroupKey(platform.getId(), platform.getName());
            addAttendance(platforms, platformKey, plannedDay.getOfficeDate(), email);

            WorkSchedule workSchedule = user == null ? null : user.getWorkSchedule();
            GroupKey scheduleKey = workSchedule == null
                    ? new GroupKey(null, "No work schedule")
                    : new GroupKey(workSchedule.getId(), workSchedule.getName());
            addAttendance(workSchedules, scheduleKey, plannedDay.getOfficeDate(), email);
            Site site = user == null ? null : user.getSite();
            records.add(new AttendanceRecord(plannedDay.getOfficeDate(), email,
                    site == null ? null : site.getName(), platformKey.id(), platformKey.name(),
                    scheduleKey.id(), scheduleKey.name()));
        }

        List<@NonNull DailyAttendance> daily = dailyAttendees.entrySet().stream()
                .map(entry -> new DailyAttendance(entry.getKey(), entry.getValue().size()))
                .toList();
        List<@NonNull GroupAttendance> byPlatform = groupAttendance(platforms, weekStart);
        List<@NonNull GroupAttendance> byWorkSchedule = groupAttendance(workSchedules, weekStart);
        records.sort(Comparator.<@NonNull AttendanceRecord, LocalDate>comparing(AttendanceRecord::date)
                .thenComparing(AttendanceRecord::email));
        WeeklyRtoSummary summary = new WeeklyRtoSummary(weekStart, weekEnd, records.size(), weeklyAttendees.size(),
                daily, byPlatform, byWorkSchedule);
        return new WeeklyRtoReport(summary, siteName, List.copyOf(records));
    }

    private static void addAttendance(Map<GroupKey, GroupAccumulator> groups, GroupKey key,
                                      LocalDate date, @NonNull String email) {
        GroupAccumulator group = groups.computeIfAbsent(key, _ -> new GroupAccumulator());
        group.rtoDays++;
        group.attendees.add(email);
        group.dailyAttendees.computeIfAbsent(date, _ -> new HashSet<>()).add(email);
    }

    private static List<@NonNull GroupAttendance> groupAttendance(Map<GroupKey, GroupAccumulator> groups, LocalDate weekStart) {
        List<@NonNull GroupAttendance> result = new ArrayList<>();
        groups.forEach((key, value) -> {
            List<@NonNull DailyAttendance> daily = new ArrayList<>();
            for (int day = 0; day < 5; day++) {
                LocalDate date = weekStart.plusDays(day);
                daily.add(new DailyAttendance(date, value.dailyAttendees.getOrDefault(date, Set.of()).size()));
            }
            result.add(new GroupAttendance(key.id(), key.name(), value.attendees.size(), value.rtoDays, daily));
        });
        result.sort(Comparator.<@NonNull GroupAttendance>comparingLong(GroupAttendance::rtoDays).reversed()
                .thenComparing(GroupAttendance::name, String.CASE_INSENSITIVE_ORDER));
        return List.copyOf(result);
    }

    public record WeeklyRtoSummary(LocalDate weekStart, LocalDate weekEnd, long totalRtoDays, long uniqueAttendees,
                                   List<@NonNull DailyAttendance> daily, List<@NonNull GroupAttendance> byPlatform,
                                   List<@NonNull GroupAttendance> byWorkSchedule) {
    }

    public record SiteOption(Long id, String name) {
    }

    public record AttendanceRecord(LocalDate date, String email, @Nullable String site, Long platformId, String platform,
                                   Long workScheduleId, String workSchedule) { }

    public record WeeklyRtoReport(WeeklyRtoSummary summary, String siteName, List<@NonNull AttendanceRecord> records) { }

    public record DailyAttendance(LocalDate date, long attendees) {
    }

    public record GroupAttendance(Long id, String name, long attendees, long rtoDays, List<@NonNull DailyAttendance> daily) {
    }

    private record GroupKey(Long id, String name) {
    }

    private static final class GroupAccumulator {
        private final Set<@NonNull String> attendees = new TreeSet<>();
        private final Map<LocalDate, Set<@NonNull String>> dailyAttendees = new HashMap<>();
        private long rtoDays;
    }
}
