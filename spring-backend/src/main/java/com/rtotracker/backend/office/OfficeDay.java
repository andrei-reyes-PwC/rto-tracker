package com.rtotracker.backend.office;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.jspecify.annotations.NonNull;

import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(
        name = "office_days",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_office_days_user_date",
                columnNames = {"user_email", "office_date"}))
public class OfficeDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 254)
    private String userEmail;

    @Column(name = "office_date", nullable = false)
    private LocalDate officeDate;

    protected OfficeDay() {
    }

    public OfficeDay(String userEmail, LocalDate officeDate) {
        this.userEmail = userEmail;
        this.officeDate = officeDate;
    }

    public @NonNull String getUserEmail() {
        return Objects.requireNonNull(userEmail, "userEmail is not initialized");
    }

    public @NonNull LocalDate getOfficeDate() {
        return Objects.requireNonNull(officeDate, "officeDate is not initialized");
    }
}
