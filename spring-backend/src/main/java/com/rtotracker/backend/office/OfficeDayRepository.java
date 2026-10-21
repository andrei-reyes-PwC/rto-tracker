package com.rtotracker.backend.office;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface OfficeDayRepository extends JpaRepository<OfficeDay, Long> {

    List<OfficeDay> findAllByUserEmailAndOfficeDateGreaterThanEqualAndOfficeDateLessThanOrderByOfficeDateAsc(
            String userEmail, LocalDate startInclusive, LocalDate endExclusive);

    List<OfficeDay> findAllByOfficeDateBetweenOrderByOfficeDateAsc(LocalDate startInclusive, LocalDate endInclusive);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            delete from OfficeDay officeDay
            where officeDay.userEmail = :userEmail
              and officeDay.officeDate >= :startInclusive
              and officeDay.officeDate < :endExclusive
            """)
    int deleteMonth(
            @Param("userEmail") String userEmail,
            @Param("startInclusive") LocalDate startInclusive,
            @Param("endExclusive") LocalDate endExclusive);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update OfficeDay officeDay set officeDay.userEmail = :replacementEmail where officeDay.userEmail = :currentEmail")
    int updateUserEmail(
            @Param("currentEmail") String currentEmail,
            @Param("replacementEmail") String replacementEmail);
}
