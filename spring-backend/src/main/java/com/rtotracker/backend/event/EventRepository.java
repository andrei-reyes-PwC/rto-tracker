package com.rtotracker.backend.event;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {
    @Query("select e from Event e left join fetch e.platform order by e.date asc, e.id asc")
    List<Event> findAllWithPlatform();
    @Query("select e from Event e left join fetch e.platform where e.id = :id")
    Optional<Event> findWithPlatformById(@Param("id") Long id);
    @Query("select e from Event e left join fetch e.platform where e.date >= :start and e.date < :end "
            + "and (e.scope = 'GLOBAL' or e.platform.id = :platformId) order by e.date asc, e.id asc")
    List<Event> findVisibleEvents(@Param("start") LocalDate start, @Param("end") LocalDate end,
                                  @Param("platformId") Long platformId);
    @Query("select e from Event e left join fetch e.platform where e.date >= :start and e.date < :end "
            + "and e.scope = 'GLOBAL' order by e.date asc, e.id asc")
    List<Event> findGlobalEvents(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
