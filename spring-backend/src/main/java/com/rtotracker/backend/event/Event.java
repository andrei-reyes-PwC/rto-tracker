package com.rtotracker.backend.event;

import com.rtotracker.backend.platform.Platform;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "events")
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "event_date", nullable = false)
    private LocalDate date;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false, length = 40)
    private String kind;
    @Column(name = "event_time", nullable = false, length = 30)
    private String time;
    @Column(nullable = false, length = 120)
    private String place;
    @Column(name = "required_in_office", nullable = false)
    private boolean required;
    @Column(nullable = false, length = 20)
    private String scope;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id")
    private Platform platform;

    protected Event() { }
    public Event(LocalDate date, String title, String kind, String time, String place, boolean required, String scope, Platform platform) {
        update(date, title, kind, time, place, required, scope, platform);
    }
    public void update(LocalDate date, String title, String kind, String time, String place, boolean required, String scope, Platform platform) {
        this.date = date; this.title = title; this.kind = kind; this.time = time; this.place = place;
        this.required = required; this.scope = scope; this.platform = platform;
    }
    public Long getId() { return id; }
    public LocalDate getDate() { return date; }
    public String getTitle() { return title; }
    public String getKind() { return kind; }
    public String getTime() { return time; }
    public String getPlace() { return place; }
    public boolean isRequired() { return required; }
    public String getScope() { return scope; }
    public Platform getPlatform() { return platform; }
}
