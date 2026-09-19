package com.cbs.sacco.systemops.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.systemops.entity.BackupRecord;
import com.cbs.sacco.systemops.entity.SchedulerJob;
import com.cbs.sacco.systemops.repo.BackupRecordRepository;
import com.cbs.sacco.systemops.repo.SchedulerJobRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/system")
public class SystemOpsController {

    private static final DateTimeFormatter FILE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final long STORAGE_CAPACITY_KB = 200_000L;

    private final BackupRecordRepository backupRepository;
    private final SchedulerJobRepository schedulerRepository;
    private final AtomicInteger cacheKeys = new AtomicInteger(486);

    public SystemOpsController(BackupRecordRepository backupRepository,
                               SchedulerJobRepository schedulerRepository) {
        this.backupRepository = backupRepository;
        this.schedulerRepository = schedulerRepository;
    }

    @GetMapping("/backups")
    public List<BackupRecord> listBackups() {
        return backupRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PostMapping("/backups")
    public BackupRecord createBackup(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        Instant startOfMinute = LocalDateTime.now()
                .withSecond(0)
                .withNano(0)
                .atZone(ZoneId.systemDefault())
                .toInstant();
        if (backupRepository.existsByCreatedAtGreaterThanEqual(startOfMinute)) {
            throw new IllegalArgumentException("A backup was already created within the same minute");
        }

        BackupRecord record = new BackupRecord();
        record.setFileName("cbs_backup_" + LocalDateTime.now().format(FILE_STAMP) + ".sql");
        record.setSizeKb(ThreadLocalRandom.current().nextInt(2000, 9001));
        record.setCreatedAt(Instant.now());
        String createdBy = str(payload, "createdBy");
        record.setCreatedBy(createdBy == null || createdBy.isBlank() ? "System" : createdBy.trim());
        record.setKind("Scheduled".equals(str(payload, "kind")) ? "Scheduled" : "Manual");
        return backupRepository.save(record);
    }

    @DeleteMapping("/backups/{id}")
    public Map<String, Object> deleteBackup(@PathVariable Long id) {
        BackupRecord record = backupRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Backup not found: " + id));
        backupRepository.delete(record);
        return Map.of("ok", true, "id", id);
    }

    @GetMapping("/cache")
    public Map<String, Object> cache() {
        return Map.of("keys", cacheKeys.get(), "lastClearedAt", "");
    }

    @PostMapping("/cache/clear")
    public Map<String, Object> clearCache() {
        int cleared = cacheKeys.getAndSet(0);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("cleared", true);
        response.put("keys", cleared);
        response.put("clearedAt", Instant.now().toString());
        return response;
    }

    @GetMapping("/scheduler")
    public List<SchedulerJob> listJobs() {
        return schedulerRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @PostMapping("/scheduler/{id}/run")
    public SchedulerJob runJob(@PathVariable Long id) {
        SchedulerJob job = schedulerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scheduled job not found: " + id));
        job.setStatus("Ok");
        job.setLastRun(Instant.now());
        job.setNextRun(Instant.now().plusSeconds(86_400));
        return schedulerRepository.save(job);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        long totalKb = backupRepository.findAll().stream()
                .mapToLong(b -> b.getSizeKb() == null ? 0L : b.getSizeKb())
                .sum();
        double storagePct = Math.min(99.0, Math.round((totalKb / (double) STORAGE_CAPACITY_KB) * 1000.0) / 10.0);
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000L;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("db", "up");
        response.put("cache", "up");
        response.put("storagePct", storagePct);
        response.put("uptime", uptimeSeconds);
        return response;
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }
}
