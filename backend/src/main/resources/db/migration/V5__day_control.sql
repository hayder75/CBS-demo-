-- ============================================================
-- V5: Business Date / Branch COB / End-of-Day module
-- ============================================================

CREATE TABLE system_business_date (
    id                 BIGSERIAL PRIMARY KEY,
    business_date      DATE NOT NULL,
    next_business_date DATE NOT NULL,
    day_status         VARCHAR(30) NOT NULL DEFAULT 'Open',
    last_eod_date      DATE
);

CREATE TABLE branch_cob (
    id            BIGSERIAL PRIMARY KEY,
    branch_id     BIGINT REFERENCES branch(id),
    branch_name   VARCHAR(120) NOT NULL,
    business_date DATE NOT NULL,
    cob_status    VARCHAR(20) NOT NULL DEFAULT 'Open',
    closed_by     VARCHAR(120),
    closed_at     TIMESTAMPTZ
);
CREATE INDEX idx_branch_cob_date ON branch_cob(business_date);

CREATE TABLE eod_run (
    id            BIGSERIAL PRIMARY KEY,
    business_date DATE NOT NULL,
    run_status    VARCHAR(20) NOT NULL DEFAULT 'Running',
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ,
    started_by    VARCHAR(120)
);

CREATE TABLE eod_step (
    id          BIGSERIAL PRIMARY KEY,
    eod_run_id  BIGINT NOT NULL REFERENCES eod_run(id),
    step_key    VARCHAR(40) NOT NULL,
    name        VARCHAR(120) NOT NULL,
    step_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    processed   INTEGER NOT NULL DEFAULT 0,
    message     VARCHAR(255)
);
CREATE INDEX idx_eod_step_run ON eod_step(eod_run_id);

INSERT INTO system_business_date (id, business_date, next_business_date, day_status, last_eod_date) VALUES
  (1, DATE '2026-09-15', DATE '2026-09-16', 'Open', DATE '2026-09-14');

INSERT INTO branch_cob (id, branch_id, branch_name, business_date, cob_status) VALUES
  (1, 1, 'Head Office', DATE '2026-09-15', 'Open'),
  (2, 2, 'Bole Branch', DATE '2026-09-15', 'Open'),
  (3, 3, 'Piassa Branch', DATE '2026-09-15', 'Open'),
  (4, 4, 'Grand Mexico Branch', DATE '2026-09-15', 'Open');

INSERT INTO eod_run (id, business_date, run_status, started_at, completed_at, started_by) VALUES
  (1, DATE '2026-09-14', 'Completed', now() - interval '1 day', now() - interval '1 day' + interval '3 minutes', 'Tigist Fikre');

INSERT INTO eod_step (id, eod_run_id, step_key, name, step_status, processed) VALUES
  (1, 1, 'step-1', 'Maintenance Fees', 'Done', 15),
  (2, 1, 'step-2', 'TFS Maturity', 'Done', 20),
  (3, 1, 'step-3', 'Loan Auto-Debit', 'Done', 25),
  (4, 1, 'step-4', 'Penalties', 'Done', 30),
  (5, 1, 'step-5', 'Loan Classification', 'Done', 35),
  (6, 1, 'step-6', 'Provisions', 'Done', 40),
  (7, 1, 'step-7', 'Dormant Accounts', 'Done', 45),
  (8, 1, 'step-8', 'Dormant Members', 'Done', 50);

SELECT setval(pg_get_serial_sequence('system_business_date', 'id'), (SELECT MAX(id) FROM system_business_date));
SELECT setval(pg_get_serial_sequence('branch_cob', 'id'), (SELECT MAX(id) FROM branch_cob));
SELECT setval(pg_get_serial_sequence('eod_run', 'id'), (SELECT MAX(id) FROM eod_run));
SELECT setval(pg_get_serial_sequence('eod_step', 'id'), (SELECT MAX(id) FROM eod_step));
