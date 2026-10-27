package com.rtotracker.backend.lunch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface LunchRecipientRepository extends JpaRepository<LunchRecipient, LunchRecipient.Key> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update LunchRecipient recipient set recipient.received = true, recipient.handedOutBy = :actorEmail "
            + "where recipient.lunchDate = :date and recipient.siteId = :siteId "
            + "and recipient.userEmail = :userEmail and recipient.received = false")
    int markReceivedIfPending(@Param("date") LocalDate date, @Param("siteId") Long siteId,
                              @Param("userEmail") String userEmail, @Param("actorEmail") String actorEmail);
}
