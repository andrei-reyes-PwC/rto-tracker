package com.rtotracker.backend.user;

import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<@NonNull User, String> {
    long countByPlatformId(Long platformId);
    Optional<@NonNull User> findByEmailIgnoreCase(String email);

    @Query("select user.email from User user order by user.email asc")
    List<@NonNull String> findAllEmails();

    @Query("select user.email from User user where (:siteId is null or user.site.id = :siteId) "
            + "and exists (select officeDay.id from OfficeDay officeDay "
            + "where officeDay.userEmail = user.email and officeDay.officeDate = :date) order by user.email asc")
    List<@NonNull String> findLunchEmailsBySiteIdAndOfficeDate(@Param("siteId") Long siteId, @Param("date") LocalDate date);

    @Query("select user from User user where (:siteId is null or user.site.id = :siteId) "
            + "and (:platform is null or coalesce(user.platform.name, 'No platform') = :platform) "
            + "and (:workSchedule is null or coalesce(user.workSchedule.name, 'No work schedule') = :workSchedule) "
            + "and (:search is null or lower(user.email) like concat('%', lower(:search), '%')) "
            + "and exists (select officeDay.id from OfficeDay officeDay "
            + "where officeDay.userEmail = user.email and officeDay.officeDate = :date)")
    Page<@NonNull User> findLunchRosterForOfficeDate(@Param("siteId") Long siteId, @Param("platform") String platform,
                                           @Param("workSchedule") String workSchedule, @Param("search") String search,
                                           @Param("date") LocalDate date, Pageable pageable);

    @Query("select distinct coalesce(user.platform.name, 'No platform') from User user order by coalesce(user.platform.name, 'No platform')")
    List<@NonNull String> findLunchPlatforms();

    @Query("select distinct coalesce(user.workSchedule.name, 'No work schedule') from User user order by coalesce(user.workSchedule.name, 'No work schedule')")
    List<@NonNull String> findLunchWorkSchedules();

    @Query(value = "select distinct user from User user left join user.roles role "
            + "where (:search is null or lower(user.email) like concat('%', lower(:search), '%')) "
            + "and (:roleCode is null or role.code = :roleCode) "
            + "and (:platformId is null or user.platform.id = :platformId) "
            + "and (:withoutPlatform = false or user.platform is null) "
            + "and (:workScheduleId is null or user.workSchedule.id = :workScheduleId) "
            + "and (:withoutWorkSchedule = false or user.workSchedule is null) "
            + "and (:siteId is null or user.site.id = :siteId) "
            + "and (:withoutSite = false or user.site is null) "
            + "order by user.email asc",
            countQuery = "select count(distinct user) from User user left join user.roles role "
                    + "where (:search is null or lower(user.email) like concat('%', lower(:search), '%')) "
                    + "and (:roleCode is null or role.code = :roleCode) "
                    + "and (:platformId is null or user.platform.id = :platformId) "
                    + "and (:withoutPlatform = false or user.platform is null) "
                    + "and (:workScheduleId is null or user.workSchedule.id = :workScheduleId) "
                    + "and (:withoutWorkSchedule = false or user.workSchedule is null) "
                    + "and (:siteId is null or user.site.id = :siteId) "
                    + "and (:withoutSite = false or user.site is null)")
    Page<@NonNull User> findAllByFilters(@Param("platformId") Long platformId,
                                @Param("withoutPlatform") boolean withoutPlatform,
                                @Param("workScheduleId") Long workScheduleId,
                                @Param("withoutWorkSchedule") boolean withoutWorkSchedule,
                                @Param("siteId") Long siteId,
                                @Param("withoutSite") boolean withoutSite,
                                @Param("roleCode") String roleCode, @Param("search") String search,
                                Pageable pageable);
}
