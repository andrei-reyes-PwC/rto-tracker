package com.rtotracker.backend.role;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class RoleService {

    private final RoleRepository roles;

    public RoleService(RoleRepository roles) {
        this.roles = roles;
    }

    public List<Role> findAll() {
        return roles.findAll(Sort.by(Sort.Direction.ASC, "code"));
    }
}
