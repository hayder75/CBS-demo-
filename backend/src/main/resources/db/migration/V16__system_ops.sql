-- ============================================================
-- V16: System Operations (backups, scheduler jobs)
-- ============================================================

CREATE TABLE backup_record (
    id          BIGSERIAL PRIMARY KEY,
    file_name   VARCHAR(160) NOT NULL,
    size_kb     INTEGER      NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  VARCHAR(160),
    kind        VARCHAR(20)  NOT NULL DEFAULT 'Manual'
);
CREATE INDEX idx_backup_record_created_at ON backup_record(created_at DESC);

INSERT INTO backup_record (id, file_name, size_kb, created_at, created_by, kind) VALUES
  (1, 'cbs_backup_20260918_230000.sql', 7420, TIMESTAMPTZ '2026-09-18 23:00:00+03', 'Scheduler', 'Scheduled'),
  (2, 'cbs_backup_20260917_230000.sql', 7185, TIMESTAMPTZ '2026-09-17 23:00:00+03', 'Scheduler', 'Scheduled'),
  (3, 'cbs_backup_20260916_141205.sql', 6903, TIMESTAMPTZ '2026-09-16 14:12:05+03', 'Tigist Fikre', 'Manual'),
  (4, 'cbs_backup_20260915_230000.sql', 6640, TIMESTAMPTZ '2026-09-15 23:00:00+03', 'Scheduler', 'Scheduled');

SELECT setval(pg_get_serial_sequence('backup_record', 'id'), (SELECT MAX(id) FROM backup_record));

CREATE TABLE scheduler_job (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(160) NOT NULL,
    cron_expression  VARCHAR(80)  NOT NULL,
    last_run         TIMESTAMPTZ,
    next_run         TIMESTAMPTZ,
    job_status       VARCHAR(20)  NOT NULL DEFAULT 'Idle'
);
CREATE INDEX idx_scheduler_job_status ON scheduler_job(job_status);

INSERT INTO scheduler_job (id, name, cron_expression, last_run, next_run, job_status) VALUES
  (1, 'Nightly Full Backup', '0 0 2 * * ?', TIMESTAMPTZ '2026-09-18 02:00:00+03', TIMESTAMPTZ '2026-09-19 02:00:00+03', 'Idle'),
  (2, 'Savings Interest Accrual', '0 15 23 * * ?', TIMESTAMPTZ '2026-09-18 23:15:00+03', TIMESTAMPTZ '2026-09-19 23:15:00+03', 'Ok'),
  (3, 'Loan Arrears Classification', '0 30 1 * * ?', TIMESTAMPTZ '2026-09-18 01:30:00+03', TIMESTAMPTZ '2026-09-19 01:30:00+03', 'Ok'),
  (4, 'Statement Dispatch', '0 0 6 * * MON', TIMESTAMPTZ '2026-09-15 06:00:00+03', TIMESTAMPTZ '2026-09-22 06:00:00+03', 'Idle'),
  (5, 'Cache Warmup', '0 */30 * * * ?', TIMESTAMPTZ '2026-09-18 21:30:00+03', TIMESTAMPTZ '2026-09-19 22:00:00+03', 'Failed');

SELECT setval(pg_get_serial_sequence('scheduler_job', 'id'), (SELECT MAX(id) FROM scheduler_job));
