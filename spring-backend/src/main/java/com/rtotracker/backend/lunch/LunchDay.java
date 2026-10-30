package com.rtotracker.backend.lunch;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.jspecify.annotations.NonNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lunch_days")
public class LunchDay {
    @EmbeddedId
    private LunchDayId id;
    @Column(name = "site_name", length = 25)
    private String siteName;
    @Column(name = "locked_by", nullable = false, length = 254)
    private String lockedBy;
    @OneToMany(mappedBy = "lunchDay", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<@NonNull LunchRecipient> recipients = new ArrayList<>();

    protected LunchDay() { }
    public LunchDay(LocalDate date, Long siteId, String siteName, String lockedBy, List<@NonNull String> emails) {
        // Site ID zero is the composite-key scope for "All Sites".
        this.id = new LunchDayId(date, siteId == null ? 0L : siteId);
        this.siteName = siteName;
        this.lockedBy = lockedBy;
        this.recipients = new ArrayList<>(emails.stream().map(email -> new LunchRecipient(this, email)).toList());
    }
    public LocalDate getLunchDate() { return id.getLunchDate(); }
    public Long getSiteId() { return id.getSiteId() == 0 ? null : id.getSiteId(); }
    public Long getScopeSiteId() { return id.getSiteId(); }
    public String getSiteName() { return siteName; }
    public List<@NonNull LunchRecipient> getRecipients() { return recipients; }
}
