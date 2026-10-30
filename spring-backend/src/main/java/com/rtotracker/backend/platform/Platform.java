package com.rtotracker.backend.platform;

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

    public void updateWeekendDaysOff(@Nullable Boolean saturdayDayOff, @Nullable Boolean sundayDayOff) {
        this.saturdayDayOff = saturdayDayOff;
        this.sundayDayOff = sundayDayOff;
    }
}
