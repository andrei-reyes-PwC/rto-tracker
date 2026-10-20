package com.rtotracker.backend.office;

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

    public OfficeDayService(OfficeDayRepository officeDays) {
        this.officeDays = officeDays;
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
}
