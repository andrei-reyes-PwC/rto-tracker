package com.rtotracker.backend.role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "protected_role", nullable = false)
    private boolean protectedRole;

    protected Role() {
    }

    public String getCode() {
        return code;
    }

    public boolean isProtectedRole() {
        return protectedRole;
    }
}
