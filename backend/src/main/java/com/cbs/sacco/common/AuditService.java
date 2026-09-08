package com.cbs.sacco.common;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuditService {

    private final EntityManager entityManager;

    public AuditService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String username, String action, String entity, String entityId, String detail) {
        entityManager.createNativeQuery(
                "INSERT INTO audit_log (username, action, entity, entity_id, detail, occurred_at) " +
                "VALUES (:username, :action, :entity, :entityId, :detail, :occurredAt)")
                .setParameter("username", username)
                .setParameter("action", action)
                .setParameter("entity", entity)
                .setParameter("entityId", entityId)
                .setParameter("detail", detail)
                .setParameter("occurredAt", Instant.now())
                .executeUpdate();
    }
}