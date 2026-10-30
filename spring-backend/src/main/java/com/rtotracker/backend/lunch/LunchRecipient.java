package com.rtotracker.backend.lunch;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

@Entity
@Table(name = "lunch_recipients")
@IdClass(LunchRecipient.Key.class)
public class LunchRecipient {
    @Id
    @Column(name = "lunch_date", nullable = false)
    private LocalDate lunchDate;
    @Id
    @Column(name = "site_id", nullable = false)
    private Long siteId;
    @Id
    @Column(name = "user_email", nullable = false, length = 254)
    private String userEmail;
    @Column(nullable = false)
    private boolean received;
    @Column(name = "original_list", nullable = false, updatable = false)
    private boolean originalList = true;
    @Column(name = "handed_out_by", length = 254)
    private String handedOutBy;
    @Column(name = "claimed_at")
    private Instant claimedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @jakarta.persistence.JoinColumns({
            @jakarta.persistence.JoinColumn(name = "lunch_date", referencedColumnName = "lunch_date", insertable = false, updatable = false),
            @jakarta.persistence.JoinColumn(name = "site_id", referencedColumnName = "site_id", insertable = false, updatable = false)
    })
    private LunchDay lunchDay;

    protected LunchRecipient() { }
    public LunchRecipient(LunchDay day, String email) {
        this.lunchDay = day;
        this.lunchDate = day.getLunchDate();
        this.siteId = day.getScopeSiteId();
        this.userEmail = email;
    }
    public @NonNull String getUserEmail() { return Objects.requireNonNull(userEmail, "userEmail is not initialized"); }
    public boolean isReceived() { return received; }
    public boolean isOriginalList() { return originalList; }
    public String getHandedOutBy() { return handedOutBy; }
    public @Nullable Instant getClaimedAt() { return claimedAt; }
    public static @NonNull LunchRecipient additionalReceived(LunchDay day, String email, String actorEmail) {
        LunchRecipient recipient = new LunchRecipient(day, email);
        recipient.originalList = false;
        recipient.received = true;
        recipient.handedOutBy = actorEmail;
        recipient.claimedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
        return recipient;
    }
    public static class Key implements Serializable {
        private static final long serialVersionUID = 1L;
        private LocalDate lunchDate;
        private Long siteId;
        private String userEmail;
        public Key() { }
        public boolean equals(Object other) { return other instanceof Key key && Objects.equals(lunchDate, key.lunchDate) && Objects.equals(siteId, key.siteId) && Objects.equals(userEmail, key.userEmail); }
        public int hashCode() { return Objects.hash(lunchDate, siteId, userEmail); }
    }
}
