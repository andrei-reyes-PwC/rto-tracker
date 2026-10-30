package com.rtotracker.backend.settings;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GlobalSettingsRepository extends JpaRepository<@NonNull GlobalSettings, Long> { }
