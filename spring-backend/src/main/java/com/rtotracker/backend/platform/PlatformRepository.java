package com.rtotracker.backend.platform;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlatformRepository extends JpaRepository<Platform, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select platform.id as id, platform.name as name, count(assignedUser.email) as userCount "
            + "from Platform platform left join User assignedUser on assignedUser.platform = platform "
            + "where :search = '' or lower(platform.name) like concat('%', :search, '%') "
            + "group by platform.id, platform.name order by platform.name asc")
    List<PlatformSummaryProjection> findAllSummaries(@Param("search") String search);

    @Query("select platform.id as id, platform.name as name from Platform platform order by platform.name asc")
    List<PlatformOptionProjection> findAllOptions();

    @Query("select platform.id as id, platform.name as name "
            + "from Platform platform join User assignedUser on assignedUser.platform = platform where assignedUser.email = :email")
    Optional<PlatformOptionProjection> findForUser(@Param("email") String email);

    interface PlatformSummaryProjection {
        Long getId();
        String getName();
        long getUserCount();
    }

    interface PlatformOptionProjection {
        Long getId();
        String getName();
    }
}
