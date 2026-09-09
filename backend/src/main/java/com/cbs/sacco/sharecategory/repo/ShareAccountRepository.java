package com.cbs.sacco.sharecategory.repo;

import com.cbs.sacco.sharecategory.entity.ShareAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareAccountRepository extends JpaRepository<ShareAccount, Long> {
    List<ShareAccount> findByMemberId(Long memberId);
    List<ShareAccount> findByStatus(String status);
}
