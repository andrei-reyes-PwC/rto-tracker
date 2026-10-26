package com.rtotracker.backend.lunch;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lunch_days")
public class LunchDay {
    @Id
    @Column(name = "lunch_date", nullable = false)
    private LocalDate lunchDate;
    @Column(name = "locked_by", nullable = false, length = 254)
    private String lockedBy;
    @OneToMany(mappedBy = "lunchDay", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<LunchRecipient> recipients = new ArrayList<>();

    protected LunchDay() { }
    public LunchDay(LocalDate date, String lockedBy, List<String> emails) {
        this.lunchDate = date;
        this.lockedBy = lockedBy;
        this.recipients = new ArrayList<>(emails.stream().map(email -> new LunchRecipient(this, email)).toList());
    }
    public LocalDate getLunchDate() { return lunchDate; }
    public List<LunchRecipient> getRecipients() { return recipients; }
}
