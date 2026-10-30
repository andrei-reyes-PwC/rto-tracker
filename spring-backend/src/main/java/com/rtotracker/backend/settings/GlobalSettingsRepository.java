package com.rtotracker.backend.settings;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface GlobalSettingsRepository extends JpaRepository<@NonNull GlobalSettings, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select settings from GlobalSettings settings where settings.id = 1")
    Optional<@NonNull GlobalSettings> lockPlanningWrites();
}
