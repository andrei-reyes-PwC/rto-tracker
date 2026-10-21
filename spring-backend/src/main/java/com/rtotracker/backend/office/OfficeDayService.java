package com.rtotracker.backend.office;

import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.TreeSet;

@Service
public class OfficeDayService {

    private final OfficeDayRepository officeDays;
    private final UserRepository users;

    public OfficeDayService(OfficeDayRepository officeDays, UserRepository users) {
        this.officeDays = officeDays;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public OfficeDayQueryResponse getSchedule(String userEmail, YearMonth month) {
        List<LocalDate> personalOfficeDays = officeDays
                .findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
                        userEmail, month.atDay(1), month.plusMonths(1).atDay(1))
                .stream()
                .map(OfficeDay::getOfficeDate)
                .toList();
        return new OfficeDayQueryResponse(month, personalOfficeDays);
    }

    @Transactional(readOnly = true)
    public PlatformOfficeDayQueryResponse getPlatformSchedule(String userEmail, LocalDate officeDate) {
        User currentUser = users.findById(userEmail).orElse(null);
        if (currentUser == null || currentUser.getPlatform() == null) {
            return new PlatformOfficeDayQueryResponse(officeDate, null, List.of());
        }

        List<PlatformOfficeDay> colleagues = officeDays.findPlatformOfficeDaysForDate(
                        currentUser.getPlatform().getId(), userEmail, officeDate)
                .stream()
                .map(day -> new PlatformOfficeDay(day.getOfficeDate(), day.getUserEmail()))
                .toList();
        return new PlatformOfficeDayQueryResponse(officeDate, currentUser.getPlatform().getName(), colleagues);
    }

    @Transactional
    public OfficeDayQueryResponse replaceMonth(String userEmail, YearMonth month, List<LocalDate> dates) {
        if (dates.stream().anyMatch(date -> !YearMonth.from(date).equals(month))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Every office date must belong to the requested month");
        }

        LocalDate startInclusive = month.atDay(1);
        LocalDate endExclusive = month.plusMonths(1).atDay(1);
        officeDays.deleteMonth(userEmail, startInclusive, endExclusive);

        List<OfficeDay> replacements = new TreeSet<>(dates).stream()
                .map(date -> new OfficeDay(userEmail, date))
                .toList();
        officeDays.saveAll(replacements);

        return getSchedule(userEmail, month);
    }

    public record OfficeDayQueryResponse(
            YearMonth month,
            List<LocalDate> officeDays) {
    }

    public record PlatformOfficeDayQueryResponse(
            LocalDate date,
            String platformName,
            List<PlatformOfficeDay> colleagues) {
    }

    public record PlatformOfficeDay(LocalDate date, String email) {
    }
}
