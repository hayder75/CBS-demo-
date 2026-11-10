package com.cbs.sacco.referral.repo;

import com.cbs.sacco.referral.entity.ReferralRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralRecordRepository extends JpaRepository<ReferralRecord, Long> {
    boolean existsByRefereePhone(String refereePhone);
}
