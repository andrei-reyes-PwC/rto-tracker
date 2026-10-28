package com.rtotracker.backend.lunch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LunchDayRepository extends JpaRepository<LunchDay, LunchDayId> {
    @Query("select day.id.lunchDate from LunchDay day where day.id.lunchDate between :start and :end "
            + "and day.id.siteId in (:siteId, 0)")
    List<LocalDate> findProcurementDatesForSite(@Param("siteId") Long siteId,
                                               @Param("start") LocalDate start,
                                               @Param("end") LocalDate end);
}
