package com.rtotracker.backend.site;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SiteRepository extends JpaRepository<Site, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    @Query("select site.id as id, site.name as name, count(user.email) as userCount "
            + "from Site site left join site.users user "
            + "where :search = '' or lower(site.name) like concat('%', :search, '%') "
            + "group by site.id, site.name order by site.name")
    List<SiteSummary> findAllSummaries(@Param("search") String search);
    @Query("select distinct site from Site site left join fetch site.users where site.id = :id")
    Optional<Site> findByIdWithUsers(@Param("id") Long id);
    interface SiteSummary {
        Long getId();
        String getName();
        long getUserCount();
    }
}
