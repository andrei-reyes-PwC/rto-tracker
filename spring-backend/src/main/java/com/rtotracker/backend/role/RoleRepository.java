package com.rtotracker.backend.role;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<@NonNull Role, String> {
}
