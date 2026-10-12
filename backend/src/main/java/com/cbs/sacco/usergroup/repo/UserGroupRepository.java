package com.cbs.sacco.usergroup.repo;

import com.cbs.sacco.usergroup.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {
    boolean existsByCode(String code);
}
