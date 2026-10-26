package com.rtotracker.backend.lunch;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "lunch_recipients")
@IdClass(LunchRecipient.Key.class)
public class LunchRecipient {
    @Id
    @Column(name = "lunch_date", nullable = false)
    private LocalDate lunchDate;
    @Id
    @Column(name = "user_email", nullable = false, length = 254)
    private String userEmail;
    @Column(nullable = false)
    private boolean received;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lunch_date", insertable = false, updatable = false)
    private LunchDay lunchDay;

    protected LunchRecipient() { }
    public LunchRecipient(LunchDay day, String email) {
        this.lunchDay = day;
        this.lunchDate = day.getLunchDate();
        this.userEmail = email;
    }
    public String getUserEmail() { return userEmail; }
    public boolean isReceived() { return received; }
    public void setReceived(boolean received) { this.received = received; }

    public static class Key implements Serializable {
        private LocalDate lunchDate;
        private String userEmail;
        public Key() { }
        public boolean equals(Object other) { return other instanceof Key key && Objects.equals(lunchDate, key.lunchDate) && Objects.equals(userEmail, key.userEmail); }
        public int hashCode() { return Objects.hash(lunchDate, userEmail); }
    }
}
