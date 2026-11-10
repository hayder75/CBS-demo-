package com.cbs.sacco.referral.repo;

import com.cbs.sacco.referral.entity.ReferralCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReferralCodeRepository extends JpaRepository<ReferralCode, Long> {
    boolean existsByMemberIdAndStatus(Long memberId, String status);

    boolean existsByCode(String code);

    Optional<ReferralCode> findByCode(String code);
}
