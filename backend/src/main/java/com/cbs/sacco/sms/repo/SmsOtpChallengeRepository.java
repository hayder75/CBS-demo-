package com.cbs.sacco.sms.repo;

import com.cbs.sacco.sms.entity.SmsOtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SmsOtpChallengeRepository extends JpaRepository<SmsOtpChallenge, Long> {
    Optional<SmsOtpChallenge> findTopByPhoneAndStatusOrderByIdDesc(String phone, String status);
}
