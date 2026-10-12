package com.cbs.sacco.deviceaccess.repo;

import com.cbs.sacco.deviceaccess.entity.DeviceAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceAccessRepository extends JpaRepository<DeviceAccess, Long> {
    List<DeviceAccess> findByUsernameOrderByLastSeenDesc(String username);
}
