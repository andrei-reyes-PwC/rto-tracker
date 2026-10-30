package com.rtotracker.backend.event;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<@NonNull Event, Long> {
    @Query("select e from Event e left join fetch e.platform left join e.platform platform "
            + "where (:date is null or e.date = :date) and (:search = '' "
            + "or lower(e.title) like concat('%', :search, '%') "
            + "or lower(e.kind) like concat('%', :search, '%') "
            + "or lower(e.place) like concat('%', :search, '%') "
            + "or lower(e.time) like concat('%', :search, '%') "
            + "or lower(e.scope) like concat('%', :search, '%') "
            + "or lower(platform.name) like concat('%', :search, '%')) "
            + "and (:platformId is null or e.platform.id = :platformId) "
            + "order by e.date asc, e.id asc")
    List<@NonNull Event> findAllWithPlatform(@Param("search") String search, @Param("date") LocalDate date,
                                   @Param("platformId") Long platformId);
    @Query("select e from Event e left join fetch e.platform where e.id = :id")
    Optional<@NonNull Event> findWithPlatformById(@Param("id") Long id);
    @Query("select e from Event e left join fetch e.platform where e.date >= :start and e.date < :end "
            + "and (e.scope = 'GLOBAL' or e.platform.id = :platformId) order by e.date asc, e.id asc")
    List<@NonNull Event> findVisibleEvents(@Param("start") LocalDate start, @Param("end") LocalDate end,
                                  @Param("platformId") Long platformId);
    @Query("select e from Event e left join fetch e.platform where e.date >= :start and e.date < :end "
            + "and e.scope = 'GLOBAL' order by e.date asc, e.id asc")
    List<@NonNull Event> findGlobalEvents(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
