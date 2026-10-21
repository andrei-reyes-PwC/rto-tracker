package com.rtotracker.backend.workschedule;

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
@Table(name = "work_schedules")
public class WorkSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 10)
    private String name;

    @OneToMany(mappedBy = "workSchedule", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    protected WorkSchedule() {
    }

    public WorkSchedule(String name, Set<User> users) {
        this.name = name;
        updateUsers(users);
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
        updateUsers(users);
    }

    private void updateUsers(Set<User> updatedUsers) {
        for (User user : users) {
            if (!updatedUsers.contains(user)) {
                user.setWorkSchedule(null);
            }
        }
        this.users = new HashSet<>(updatedUsers);
        for (User user : this.users) {
            user.setWorkSchedule(this);
        }
    }
}
