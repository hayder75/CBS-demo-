package com.cbs.sacco.referral.repo;

import com.cbs.sacco.referral.entity.ReferralSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralSettingsRepository extends JpaRepository<ReferralSettings, Long> {
}
