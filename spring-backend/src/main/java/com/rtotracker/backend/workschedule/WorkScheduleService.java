package com.rtotracker.backend.workschedule;

import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserSelectionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class WorkScheduleService {

    private final WorkScheduleRepository workSchedules;
    private final UserSelectionService userSelection;

    public WorkScheduleService(WorkScheduleRepository workSchedules, UserSelectionService userSelection) {
        this.workSchedules = workSchedules;
        this.userSelection = userSelection;
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleRepository.WorkScheduleSummaryProjection> findAllSummaries(String search) {
        return workSchedules.findAllSummaries(search.trim().toLowerCase());
    }

    @Transactional(readOnly = true)
    public WorkSchedule findById(Long id) {
        return workSchedules.findByIdWithUsers(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work schedule not found"));
    }

    public WorkSchedule create(String name, List<String> userEmails) {
        return workSchedules.save(new WorkSchedule(normalizeName(name), findUsers(userEmails, null)));
    }

    public WorkSchedule update(Long id, String name, List<String> userEmails) {
        WorkSchedule schedule = workSchedules.findByIdWithUsers(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work schedule not found"));
        schedule.update(normalizeName(name), findUsers(userEmails, id));
        return schedule;
    }

    public void delete(Long id) {
        WorkSchedule schedule = workSchedules.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work schedule not found"));
        workSchedules.delete(schedule);
    }

    private Set<User> findUsers(List<String> requestedEmails, Long currentScheduleId) {
        Set<User> foundUsers = userSelection.findExistingByEmails(requestedEmails);
        boolean alreadyAssigned = foundUsers.stream().anyMatch(user -> user.getWorkSchedule() != null
                && !user.getWorkSchedule().getId().equals(currentScheduleId));
        if (alreadyAssigned) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Each user can belong to only one work schedule");
        }
        return Set.copyOf(foundUsers);
    }

    private static String normalizeName(String name) {
        return name.trim();
    }
}
