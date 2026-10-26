package com.rtotracker.backend.site;

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
@Table(name = "sites")
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 25)
    private String name;
    @OneToMany(mappedBy = "site", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    protected Site() {
    }

    public Site(String name, Set<User> users) {
        this.name = name;
        updateUsers(users);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Set<User> getUsers() { return Set.copyOf(users); }

    public void update(String name, Set<User> users) {
        this.name = name;
        updateUsers(users);
    }

    private void updateUsers(Set<User> updated) {
        for (User user : users) {
            if (!updated.contains(user)) {
                user.setSite(null);
            }
        }
        users = new HashSet<>(updated);
        for (User user : this.users) {
            user.setSite(this);
        }
    }
}
