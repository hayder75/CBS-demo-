package com.cbs.sacco.audittrail.service;

import com.cbs.sacco.audittrail.entity.AuditTrailEntry;
import com.cbs.sacco.audittrail.repo.AuditTrailRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class AuditTrailService {

    private static final String GENESIS = "GENESIS";

    private final AuditTrailRepository repository;
    private final TransactionTemplate transactionTemplate;

    public AuditTrailService(AuditTrailRepository repository, PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public synchronized AuditTrailEntry append(String actor, String action, String entity, String entityId,
                                               String fieldName, String oldValue, String newValue,
                                               String detail, String ip) {
        return transactionTemplate.execute(status -> {
            String prevHash = repository.findTopByOrderByIdDesc()
                    .map(AuditTrailEntry::getHash)
                    .orElse(GENESIS);

            AuditTrailEntry entry = new AuditTrailEntry();
            entry.setActor(actor == null || actor.isBlank() ? "System" : actor);
            entry.setAction(action);
            entry.setEntity(entity);
            entry.setEntityId(entityId);
            entry.setFieldName(fieldName);
            entry.setOldValue(oldValue);
            entry.setNewValue(newValue);
            entry.setDetail(detail);
            entry.setIp(ip);
            entry.setOccurredAt(Instant.now().truncatedTo(ChronoUnit.MILLIS));
            entry.setPrevHash(prevHash);
            entry.setHash(sha256(prevHash + payload(entry)));
            return repository.save(entry);
        });
    }

    @Transactional(readOnly = true)
    public List<AuditTrailEntry> list(String entity, String action, String actor, String q,
                                      String from, String to) {
        Instant fromInstant = parseBound(from, false);
        Instant toInstant = parseBound(to, true);
        String needle = q == null || q.isBlank() ? null : q.trim().toLowerCase(Locale.ROOT);

        Comparator<AuditTrailEntry> newestFirst = Comparator
                .comparing(AuditTrailEntry::getOccurredAt)
                .thenComparing(AuditTrailEntry::getId)
                .reversed();

        return repository.findAll().stream()
                .filter(entry -> equalsIgnoreCase(entity, entry.getEntity()))
                .filter(entry -> equalsIgnoreCase(action, entry.getAction()))
                .filter(entry -> equalsIgnoreCase(actor, entry.getActor()))
                .filter(entry -> fromInstant == null || !entry.getOccurredAt().isBefore(fromInstant))
                .filter(entry -> toInstant == null || !entry.getOccurredAt().isAfter(toInstant))
                .filter(entry -> contains(needle, entry.getActor(), entry.getEntity(), entry.getEntityId(),
                        entry.getFieldName(), entry.getOldValue(), entry.getNewValue(), entry.getDetail()))
                .sorted(newestFirst)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> actors() {
        return repository.findDistinctActors();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verify() {
        List<AuditTrailEntry> entries = repository.findAllByOrderByIdAsc();
        String prevHash = GENESIS;
        for (AuditTrailEntry entry : entries) {
            boolean prevOk = Objects.equals(prevHash, entry.getPrevHash());
            boolean hashOk = Objects.equals(sha256(prevHash + payload(entry)), entry.getHash());
            if (!prevOk || !hashOk) {
                Map<String, Object> broken = new LinkedHashMap<>();
                broken.put("valid", false);
                broken.put("checked", entries.size());
                broken.put("brokenAt", String.valueOf(entry.getId()));
                return broken;
            }
            prevHash = entry.getHash();
        }
        Map<String, Object> valid = new LinkedHashMap<>();
        valid.put("valid", true);
        valid.put("checked", entries.size());
        return valid;
    }

    private static String payload(AuditTrailEntry entry) {
        return String.join("|",
                nz(entry.getActor()),
                nz(entry.getAction()),
                nz(entry.getEntity()),
                nz(entry.getEntityId()),
                nz(entry.getFieldName()),
                nz(entry.getOldValue()),
                nz(entry.getNewValue()),
                nz(entry.getDetail()),
                nz(entry.getIp()),
                nz(entry.getOccurredAt() == null ? null : entry.getOccurredAt().toString()));
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private static boolean equalsIgnoreCase(String expected, String actual) {
        return expected == null || expected.isBlank() || (actual != null && actual.equalsIgnoreCase(expected));
    }

    private static boolean contains(String needle, String... values) {
        if (needle == null) return true;
        for (String value : values) {
            if (value != null && value.toLowerCase(Locale.ROOT).contains(needle)) return true;
        }
        return false;
    }

    private static Instant parseBound(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) return null;
        try {
            if (value.length() == 10) {
                LocalDate date = LocalDate.parse(value);
                if (endOfDay) {
                    return date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
                }
                return date.atStartOfDay(ZoneOffset.UTC).toInstant();
            }
            return Instant.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}
