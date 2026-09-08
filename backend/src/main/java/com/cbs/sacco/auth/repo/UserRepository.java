package com.cbs.sacco.auth.repo;

import com.cbs.sacco.auth.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findFirstByRoleCode(String roleCode);
}