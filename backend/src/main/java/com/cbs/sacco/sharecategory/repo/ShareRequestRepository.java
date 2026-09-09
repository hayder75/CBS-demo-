package com.cbs.sacco.sharecategory.repo;

import com.cbs.sacco.sharecategory.entity.ShareRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareRequestRepository extends JpaRepository<ShareRequest, Long> {
    List<ShareRequest> findByStatus(String status);
}
