package com.cbs.sacco.sms.repo;

import com.cbs.sacco.sms.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SmsLogRepository extends JpaRepository<SmsLog, Long> {
    List<SmsLog> findTop50ByOrderByIdDesc();
}
