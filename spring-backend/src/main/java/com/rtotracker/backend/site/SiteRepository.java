package com.rtotracker.backend.site;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SiteRepository extends JpaRepository<@NonNull Site, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    @Query("select site.id as id, site.name as name, count(assignedUser.email) as userCount "
            + "from Site site left join User assignedUser on assignedUser.site = site "
            + "where :search = '' or lower(site.name) like concat('%', :search, '%') "
            + "group by site.id, site.name order by site.name")
    List<@NonNull SiteSummary> findAllSummaries(@Param("search") String search);
    interface SiteSummary {
        Long getId();
        String getName();
        long getUserCount();
    }
}
