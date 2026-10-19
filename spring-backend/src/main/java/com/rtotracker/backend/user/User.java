package com.rtotracker.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "email", nullable = false, length = 254)
    private String email;

    protected User() {
    }

    public User(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
