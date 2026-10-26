package com.rtotracker.backend.lunch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface LunchDayRepository extends JpaRepository<LunchDay, LocalDate> { }
