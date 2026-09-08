package com.cbs.sacco.notification.repo;

import com.cbs.sacco.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {}