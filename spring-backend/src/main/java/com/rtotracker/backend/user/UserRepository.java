package com.rtotracker.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {

    @Query("select user from Platform platform join platform.users user where platform.id = :platformId order by user.email asc")
    Page<User> findAllByPlatformId(@Param("platformId") Long platformId, Pageable pageable);
}
