package com.rtotracker.backend.lunch;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Embeddable
public class LunchDayId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "lunch_date", nullable = false)
    private LocalDate lunchDate;

    @Column(name = "site_id", nullable = false)
    private Long siteId;

    protected LunchDayId() { }

    public LunchDayId(LocalDate lunchDate, Long siteId) {
        this.lunchDate = lunchDate;
        this.siteId = siteId;
    }

    public LocalDate getLunchDate() { return lunchDate; }
    public Long getSiteId() { return siteId; }

    @Override
    public boolean equals(Object other) {
        return other instanceof LunchDayId key
                && Objects.equals(lunchDate, key.lunchDate)
                && Objects.equals(siteId, key.siteId);
    }

    @Override
    public int hashCode() { return Objects.hash(lunchDate, siteId); }
}
