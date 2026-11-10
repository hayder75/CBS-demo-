package com.cbs.sacco.audittrail.listener;

import com.cbs.sacco.audittrail.service.AuditTrailService;
import jakarta.servlet.http.HttpServletRequest;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostDeleteEventListener;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Locale;
import java.util.Objects;

@Component
public class AuditTrailEventListener
        implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditTrailEventListener.class);
    private static final int MAX_VALUE_LENGTH = 2000;

    private final AuditTrailService auditTrailService;

    public AuditTrailEventListener(@Lazy AuditTrailService auditTrailService) {
        this.auditTrailService = auditTrailService;
    }

    @Override
    public void onPostInsert(PostInsertEvent event) {
        try {
            String entity = entityName(event.getPersister());
            if (isAuditEntry(entity)) return;
            auditTrailService.append(actor(), "CREATE", entity, idOf(event.getId()),
                    null, null, null, "Created " + entity, ipAddress());
        } catch (Exception ex) {
            log.warn("Audit trail capture failed for insert: {}", ex.getMessage());
        }
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        try {
            String entity = entityName(event.getPersister());
            if (isAuditEntry(entity)) return;

            String[] propertyNames = event.getPersister().getPropertyNames();
            Object[] oldState = event.getOldState();
            Object[] state = event.getState();
            int[] dirtyProperties = event.getDirtyProperties();
            if (propertyNames == null || dirtyProperties == null) return;

            String entityId = idOf(event.getId());
            for (int index : dirtyProperties) {
                if (index < 0 || index >= propertyNames.length) continue;
                String field = propertyNames[index];
                boolean redact = isSensitive(field);
                String oldValue = redact ? "***" : stringify(oldState, index);
                String newValue = redact ? "***" : stringify(state, index);
                if (!redact && Objects.equals(oldValue, newValue)) continue;
                auditTrailService.append(actor(), "UPDATE", entity, entityId, field, oldValue, newValue,
                        "Updated " + field + " on " + entity, ipAddress());
            }
        } catch (Exception ex) {
            log.warn("Audit trail capture failed for update: {}", ex.getMessage());
        }
    }

    @Override
    public void onPostDelete(PostDeleteEvent event) {
        try {
            String entity = entityName(event.getPersister());
            if (isAuditEntry(entity)) return;
            auditTrailService.append(actor(), "DELETE", entity, idOf(event.getId()),
                    null, null, null, "Deleted " + entity, ipAddress());
        } catch (Exception ex) {
            log.warn("Audit trail capture failed for delete: {}", ex.getMessage());
        }
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }

    private static String entityName(EntityPersister persister) {
        String name = persister.getEntityName();
        int separator = name.lastIndexOf('.');
        return separator >= 0 ? name.substring(separator + 1) : name;
    }

    private static boolean isAuditEntry(String entity) {
        return "AuditTrailEntry".equals(entity);
    }

    private static String idOf(Object id) {
        return id == null ? null : id.toString();
    }

    private static String stringify(Object[] values, int index) {
        if (values == null || index >= values.length) return null;
        Object value = values[index];
        if (value == null) return null;
        try {
            String text;
            if (value instanceof byte[] bytes) {
                text = "[binary " + bytes.length + " bytes]";
            } else if (value instanceof char[]) {
                text = "[redacted]";
            } else {
                text = String.valueOf(value);
            }
            return text.length() > MAX_VALUE_LENGTH ? text.substring(0, MAX_VALUE_LENGTH) + "..." : text;
        } catch (Exception ex) {
            return "[unavailable]";
        }
    }

    private static boolean isSensitive(String field) {
        String name = field == null ? "" : field.toLowerCase(Locale.ROOT);
        return name.equals("password")
                || name.equals("passwordhash")
                || name.equals("apikey")
                || name.equals("secret")
                || name.equals("token")
                || name.contains("password")
                || name.contains("secret")
                || name.contains("token")
                || name.contains("apikey")
                || name.contains("api_key");
    }

    private static String actor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return "System";
        String name = authentication.getName();
        if (name == null || name.isBlank() || "anonymousUser".equals(name)) return "System";
        return name;
    }

    private static String ipAddress() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) return null;
        HttpServletRequest request = servletAttributes.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }
}
