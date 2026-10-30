package com.rtotracker.backend.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "global_settings")
public class GlobalSettings {
    @Id
    private Long id = 1L;

    @Column(name = "saturday_day_off", nullable = false)
    private boolean saturdayDayOff;

    @Column(name = "sunday_day_off", nullable = false)
    private boolean sundayDayOff;

    public boolean isSaturdayDayOff() { return saturdayDayOff; }
    public boolean isSundayDayOff() { return sundayDayOff; }

    public void update(boolean saturdayDayOff, boolean sundayDayOff) {
        this.saturdayDayOff = saturdayDayOff;
        this.sundayDayOff = sundayDayOff;
    }
}
