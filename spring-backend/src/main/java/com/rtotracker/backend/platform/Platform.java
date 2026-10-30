package com.rtotracker.backend.platform;

import com.rtotracker.backend.settings.SchedulingMode;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "platforms")
public class Platform {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 20)
    private String name;

    @Column(name = "saturday_day_off")
    private @Nullable Boolean saturdayDayOff;

    @Column(name = "sunday_day_off")
    private @Nullable Boolean sundayDayOff;

    @Enumerated(EnumType.STRING)
    @Column(name = "scheduling_mode", length = 25)
    private @Nullable SchedulingMode schedulingMode;

    protected Platform() {
    }

    public Platform(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public @Nullable Boolean getSaturdayDayOff() { return saturdayDayOff; }
    public @Nullable Boolean getSundayDayOff() { return sundayDayOff; }
    public @Nullable SchedulingMode getSchedulingMode() { return schedulingMode; }

    public void updatePlanningRules(@Nullable Boolean saturdayDayOff, @Nullable Boolean sundayDayOff,
                                    @Nullable SchedulingMode schedulingMode) {
        this.saturdayDayOff = saturdayDayOff;
        this.sundayDayOff = sundayDayOff;
        this.schedulingMode = schedulingMode;
    }
}
