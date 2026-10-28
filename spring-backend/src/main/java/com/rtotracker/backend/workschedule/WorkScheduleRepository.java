package com.rtotracker.backend.workschedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select schedule.id as id, schedule.name as name, count(assignedUser.email) as userCount "
            + "from WorkSchedule schedule left join User assignedUser on assignedUser.workSchedule = schedule "
            + "where :search = '' or lower(schedule.name) like concat('%', :search, '%') "
            + "group by schedule.id, schedule.name order by schedule.name asc")
    List<WorkScheduleSummaryProjection> findAllSummaries(@Param("search") String search);

    @Query("select distinct schedule.id as id, schedule.name as name from WorkSchedule schedule "
            + "join User assignedUser on assignedUser.workSchedule = schedule where assignedUser.platform.id = :platformId order by schedule.name asc")
    List<WorkScheduleOptionProjection> findOptionsByPlatformId(@Param("platformId") Long platformId);

    interface WorkScheduleSummaryProjection {
        Long getId();
        String getName();
        long getUserCount();
    }

    interface WorkScheduleOptionProjection {
        Long getId();
        String getName();
    }
}
