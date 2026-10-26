package com.rtotracker.backend.lunch;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LunchDayRepository extends JpaRepository<LunchDay, LunchDayId> { }
