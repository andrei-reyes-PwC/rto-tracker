package com.rtotracker.backend.workschedule;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@Service
@Transactional
public class WorkScheduleService {

    private final WorkScheduleRepository workSchedules;
    public WorkScheduleService(WorkScheduleRepository workSchedules) {
        this.workSchedules = workSchedules;
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleRepository.WorkScheduleSummaryProjection> findAllSummaries(String search) {
        return workSchedules.findAllSummaries(search.trim().toLowerCase());
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleRepository.WorkScheduleOptionProjection> findOptionsByPlatformId(Long platformId) {
        return workSchedules.findOptionsByPlatformId(platformId);
    }

    public WorkSchedule create(String name) {
        String normalizedName = normalizeName(name);
        if (workSchedules.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A work schedule with this name already exists");
        }
        return workSchedules.save(new WorkSchedule(normalizedName));
    }

    public WorkSchedule update(Long id, String name) {
        WorkSchedule schedule = workSchedules.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work schedule not found"));
        String normalizedName = normalizeName(name);
        if (workSchedules.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A work schedule with this name already exists");
        }
        schedule.updateName(normalizedName);
        return schedule;
    }

    public void delete(Long id) {
        WorkSchedule schedule = workSchedules.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work schedule not found"));
        workSchedules.delete(schedule);
    }

    private static String normalizeName(String name) {
        return name.trim();
    }
}
