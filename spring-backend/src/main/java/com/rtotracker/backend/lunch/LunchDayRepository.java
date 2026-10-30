package com.rtotracker.backend.lunch;

import jakarta.persistence.LockModeType;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LunchDayRepository extends JpaRepository<@NonNull LunchDay, LunchDayId> {
    // Serialize handouts for a Site/date, including inserts for recipients outside the snapshot.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select day from LunchDay day left join fetch day.recipients where day.id = :id")
    Optional<@NonNull LunchDay> findForScanById(@Param("id") LunchDayId id);

    @Query("select day.id.lunchDate from LunchDay day where day.id.lunchDate between :start and :end "
            + "and day.id.siteId in (:siteId, 0)")
    List<@NonNull LocalDate> findProcurementDatesForSite(@Param("siteId") Long siteId,
                                               @Param("start") LocalDate start,
                                               @Param("end") LocalDate end);
}
