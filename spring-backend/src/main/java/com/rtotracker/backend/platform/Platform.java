package com.rtotracker.backend.platform;

import com.rtotracker.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "platforms")
public class Platform {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @OneToMany(mappedBy = "platform", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    protected Platform() {
    }

    public Platform(String name, Set<User> users) {
        this.name = name;
        updateMembers(users);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Set<User> getUsers() {
        return Set.copyOf(users);
    }

    public void update(String name, Set<User> users) {
        this.name = name;
        updateMembers(users);
    }

    private void updateMembers(Set<User> updatedUsers) {
        for (User user : users) {
            if (!updatedUsers.contains(user)) {
                user.setPlatform(null);
            }
        }
        this.users = new HashSet<>(updatedUsers);
        for (User user : this.users) {
            user.setPlatform(this);
        }
    }
}
