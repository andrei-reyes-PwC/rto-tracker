package com.rtotracker.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {

    @Query("select user.email from User user order by user.email asc")
    List<String> findAllEmails();

    @Query(value = "select distinct user from User user left join user.roles role "
            + "where (:search is null or lower(user.email) like concat('%', lower(:search), '%')) "
            + "and (:roleCode is null or role.code = :roleCode) "
            + "and (:platformId is null or user.platform.id = :platformId) "
            + "and (:withoutPlatform = false or user.platform is null) "
            + "and (:workScheduleId is null or user.workSchedule.id = :workScheduleId) "
            + "and (:withoutWorkSchedule = false or user.workSchedule is null) "
            + "order by user.email asc",
            countQuery = "select count(distinct user) from User user left join user.roles role "
                    + "where (:search is null or lower(user.email) like concat('%', lower(:search), '%')) "
                    + "and (:roleCode is null or role.code = :roleCode) "
                    + "and (:platformId is null or user.platform.id = :platformId) "
                    + "and (:withoutPlatform = false or user.platform is null) "
                    + "and (:workScheduleId is null or user.workSchedule.id = :workScheduleId) "
                    + "and (:withoutWorkSchedule = false or user.workSchedule is null)")
    Page<User> findAllByFilters(@Param("platformId") Long platformId,
                                @Param("withoutPlatform") boolean withoutPlatform,
                                @Param("workScheduleId") Long workScheduleId,
                                @Param("withoutWorkSchedule") boolean withoutWorkSchedule,
                                @Param("roleCode") String roleCode, @Param("search") String search,
                                Pageable pageable);
}
