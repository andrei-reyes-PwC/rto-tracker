package com.rtotracker.backend.user;

import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.role.Role;
import com.rtotracker.backend.site.Site;
import com.rtotracker.backend.workschedule.WorkSchedule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.jspecify.annotations.NonNull;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "email", nullable = false, length = 254)
    private String email;

    @Column(name = "password_hash", length = 60)
    private String passwordHash;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_email", referencedColumnName = "email"),
            inverseJoinColumns = @JoinColumn(name = "role_code", referencedColumnName = "code"))
    private Set<@NonNull Role> roles = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "platform_id")
    private Platform platform;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "work_schedule_id")
    private WorkSchedule workSchedule;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    protected User() {
    }

    public User(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public User(String email, String passwordHash, Set<@NonNull Role> roles) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.roles = new HashSet<>(roles);
    }

    public @NonNull String getEmail() {
        return Objects.requireNonNull(email, "email is not initialized");
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Set<@NonNull Role> getRoles() {
        return Set.copyOf(roles);
    }

    public void setRoles(Set<@NonNull Role> roles) {
        this.roles = new HashSet<>(roles);
    }

    public Platform getPlatform() {
        return platform;
    }

    public void setPlatform(Platform platform) {
        this.platform = platform;
    }

    public WorkSchedule getWorkSchedule() {
        return workSchedule;
    }

    public void setWorkSchedule(WorkSchedule workSchedule) {
        this.workSchedule = workSchedule;
    }

    public Site getSite() { return site; }

    public void setSite(Site site) { this.site = site; }
}
