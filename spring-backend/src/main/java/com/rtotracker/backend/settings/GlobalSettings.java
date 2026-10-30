package com.rtotracker.backend.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "scheduling_mode", nullable = false, length = 25)
    private SchedulingMode schedulingMode = SchedulingMode.FLEXIBLE;

    public boolean isSaturdayDayOff() { return saturdayDayOff; }
    public boolean isSundayDayOff() { return sundayDayOff; }
    public SchedulingMode getSchedulingMode() { return schedulingMode; }

    public void update(boolean saturdayDayOff, boolean sundayDayOff, SchedulingMode schedulingMode) {
        this.saturdayDayOff = saturdayDayOff;
        this.sundayDayOff = sundayDayOff;
        this.schedulingMode = schedulingMode;
    }
}
