package com.rtotracker.backend.assistant;

import com.rtotracker.backend.event.Event;
import com.rtotracker.backend.event.EventRepository;
import com.rtotracker.backend.office.OfficeDay;
import com.rtotracker.backend.office.OfficeDayRepository;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class AssistantService {

    private static final ZoneId PLANNING_ZONE = ZoneId.of("Asia/Singapore");
    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    private final EventRepository events;
    private final OfficeDayRepository officeDays;
    private final UserService users;

    public AssistantService(EventRepository events, OfficeDayRepository officeDays, UserService users) {
        this.events = events;
        this.officeDays = officeDays;
        this.users = users;
    }

    public List<EventData> visibleEventsForUser(String email, LocalDate startDate, LocalDate endDate) {
        validateAssistantDataRange(startDate, endDate);
        Long platformId = platformIdFor(email);
        List<Event> visibleEvents = platformId == null
                ? events.findGlobalEvents(startDate, endDate.plusDays(1))
                : events.findVisibleEvents(startDate, endDate.plusDays(1), platformId);
        logger.info("Assistant event tool returned {} event(s) for {}..{}",
                visibleEvents.size(), startDate, endDate);
        return visibleEvents.stream().map(event -> new EventData(event.getDate(), event.getTitle(),
                event.getKind(), event.getTime(), event.getPlace(), event.isRequired())).toList();
    }

    public List<MemberCount> rtoMemberCountsForUser(String email, LocalDate startDate, LocalDate endDate) {
        validateAssistantDataRange(startDate, endDate);
        Long platformId = platformIdFor(email);
        if (platformId == null) return List.of();
        List<OfficeDayRepository.PlatformDailyAttendanceProjection> counts =
                officeDays.findPlatformAttendance(platformId, email, startDate, endDate.plusDays(1));
        logger.info("Assistant member-count tool returned {} day(s) for {}..{}",
                counts.size(), startDate, endDate);
        return counts.stream()
                .map(day -> new MemberCount(day.getOfficeDate(), day.getAttendees())).toList();
    }

    public List<ScheduledDay> myOfficeSchedule(String email, LocalDate startDate, LocalDate endDate) {
        validateAssistantDataRange(startDate, endDate);
        List<OfficeDay> schedule = officeDays
                .findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                        email, startDate, endDate.plusDays(1));
        logger.info("Assistant schedule tool returned {} saved day(s) for {}..{}",
                schedule.size(), startDate, endDate);
        return schedule.stream().map(day -> new ScheduledDay(day.getOfficeDate())).toList();
    }

    public static void validateAssistantDataRange(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now(PLANNING_ZONE);
        LocalDate earliestDate = today.withDayOfMonth(1);
        LocalDate nextMonthStart = today.withDayOfMonth(1).plusMonths(2);
        LocalDate latestDate = nextMonthStart.minusDays(1);
        if (startDate == null || endDate == null || startDate.isAfter(endDate)
                || startDate.isBefore(earliestDate) || endDate.isAfter(latestDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Read-only assistant data must stay between the first of this month and the end of next month.");
        }
    }

    private Long platformIdFor(String email) {
        User user = users.findByEmail(email);
        return user.getPlatform() == null ? null : user.getPlatform().getId();
    }

    public record EventData(LocalDate date, String title, String kind, String time, String place,
                            boolean requiredInOffice) { }

    public record MemberCount(LocalDate date, long otherMembers) { }

    public record ScheduledDay(LocalDate date) { }
}
