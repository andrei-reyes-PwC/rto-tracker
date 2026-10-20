package com.rtotracker.backend.platform;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlatformRepository extends JpaRepository<Platform, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select platform.id as id, platform.name as name, count(user.email) as userCount "
            + "from Platform platform left join platform.users user "
            + "group by platform.id, platform.name order by platform.name asc")
    List<PlatformSummaryProjection> findAllSummaries();

    @Query("select platform.id as id, platform.name as name from Platform platform order by platform.name asc")
    List<PlatformOptionProjection> findAllOptions();

    @Query("select user.email as userEmail, platform.id as id, platform.name as name "
            + "from Platform platform join platform.users user where user.email in :emails order by platform.name asc")
    List<UserPlatformProjection> findMembershipsForUsers(@Param("emails") List<String> emails);

    @Query("select platform from Platform platform join platform.users user where user.email = :email order by platform.name asc")
    List<Platform> findAllForUser(@Param("email") String email);

    @Modifying
    @Query(value = "UPDATE platform_users SET user_email = :replacementEmail WHERE user_email = :currentEmail",
            nativeQuery = true)
    void updateMemberEmail(@Param("currentEmail") String currentEmail,
                           @Param("replacementEmail") String replacementEmail);

    interface PlatformSummaryProjection {
        Long getId();
        String getName();
        long getUserCount();
    }

    interface PlatformOptionProjection {
        Long getId();
        String getName();
    }

    interface UserPlatformProjection {
        String getUserEmail();
        Long getId();
        String getName();
    }
}
