package com.rtotracker.backend.platform;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformRepository extends JpaRepository<Platform, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Modifying
    @Query(value = "UPDATE platform_users SET user_email = :replacementEmail WHERE user_email = :currentEmail",
            nativeQuery = true)
    void updateMemberEmail(@Param("currentEmail") String currentEmail,
                           @Param("replacementEmail") String replacementEmail);
}
