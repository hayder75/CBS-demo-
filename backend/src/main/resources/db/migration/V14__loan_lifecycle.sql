-- ============================================================
-- V14: Advanced Loan Lifecycle
-- Restructures, write-offs, recoveries, provisioning, auto-debit
-- ============================================================

CREATE TABLE loan_restructure (
    id                 BIGSERIAL PRIMARY KEY,
    loan_id            BIGINT       NOT NULL REFERENCES loan(id),
    loan_no            VARCHAR(40),
    member_name        VARCHAR(160),
    old_term_months    INTEGER,
    new_term_months    INTEGER      NOT NULL,
    old_rate_pct       NUMERIC(8,2) NOT NULL DEFAULT 0,
    new_rate_pct       NUMERIC(8,2) NOT NULL DEFAULT 0,
    outstanding        NUMERIC(18,2) NOT NULL DEFAULT 0,
    reason             VARCHAR(500),
    fee                NUMERIC(18,2) NOT NULL DEFAULT 0,
    restructure_status VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    requested_by       VARCHAR(120),
    approved_by        VARCHAR(120),
    requested_at       TIMESTAMPTZ
);
CREATE INDEX idx_loan_restructure_loan ON loan_restructure(loan_id);
CREATE INDEX idx_loan_restructure_status ON loan_restructure(restructure_status);

CREATE TABLE loan_write_off (
    id              BIGSERIAL PRIMARY KEY,
    loan_id         BIGINT        NOT NULL REFERENCES loan(id),
    loan_no         VARCHAR(40),
    member_name     VARCHAR(160),
    balance         NUMERIC(18,2) NOT NULL DEFAULT 0,
    writeoff_type   VARCHAR(10)   NOT NULL DEFAULT 'Full',
    reason          VARCHAR(500),
    writeoff_status VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    requested_by    VARCHAR(120),
    approved_by     VARCHAR(120),
    requested_at    TIMESTAMPTZ
);
CREATE INDEX idx_loan_write_off_loan ON loan_write_off(loan_id);
CREATE INDEX idx_loan_write_off_status ON loan_write_off(writeoff_status);

CREATE TABLE loan_recovery (
    id              BIGSERIAL PRIMARY KEY,
    loan_id         BIGINT        NOT NULL REFERENCES loan(id),
    loan_no         VARCHAR(40),
    member_name     VARCHAR(160),
    recovery_date   DATE,
    amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
    recovery_source VARCHAR(20)   NOT NULL DEFAULT 'Cash',
    recorded_by     VARCHAR(120)
);
CREATE INDEX idx_loan_recovery_loan ON loan_recovery(loan_id);

CREATE TABLE provision_policy (
    id             BIGSERIAL PRIMARY KEY,
    classification VARCHAR(40)   NOT NULL UNIQUE,
    provision_pct  NUMERIC(8,2)  NOT NULL DEFAULT 0
);

CREATE TABLE provision_run (
    id              BIGSERIAL PRIMARY KEY,
    business_date   DATE,
    loans_processed INTEGER       NOT NULL DEFAULT 0,
    total_provision NUMERIC(18,2) NOT NULL DEFAULT 0,
    run_at          TIMESTAMPTZ,
    run_by          VARCHAR(120)
);

CREATE TABLE loan_auto_debit (
    id              BIGSERIAL PRIMARY KEY,
    loan_id         BIGINT,
    loan_no         VARCHAR(40),
    member_name     VARCHAR(160),
    installment     NUMERIC(18,2) NOT NULL DEFAULT 0,
    savings_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    debit_status    VARCHAR(20)   NOT NULL DEFAULT 'Scheduled'
);
CREATE INDEX idx_loan_auto_debit_loan ON loan_auto_debit(loan_id);

INSERT INTO loan_restructure
  (id, loan_id, loan_no, member_name, old_term_months, new_term_months, old_rate_pct, new_rate_pct,
   outstanding, reason, fee, restructure_status, requested_by, approved_by, requested_at)
VALUES
  (1, 6, 'LN-2025-088', 'Gizachew Tulu', 24, 36, 12.0, 10.5, 58000,
   'Member suffered drought-related income loss; extended tenor reduces monthly burden.',
   500, 'Pending', 'Kaleab Desta', NULL, TIMESTAMPTZ '2026-09-10 09:20:00+03'),
  (2, 2, 'LN-2026-014', 'Hanna Girma', 36, 48, 10.5, 10.0, 61000,
   'Education expense season; restructuring aligned to school calendar cash flows.',
   300, 'Approved', 'Rahel Abebe', 'Tigist Fikre', TIMESTAMPTZ '2026-09-06 11:05:00+03'),
  (3, 8, 'LN-2025-112', 'Selam Teshome', 12, 18, 13.0, 12.0, 7000,
   'Recovery negotiation with member; small residual balance re-aged.',
   200, 'Executed', 'Biruk Kebede', 'Sisay Worku', TIMESTAMPTZ '2026-08-18 08:40:00+03'),
  (4, 1, 'LN-2026-001', 'Abebe Bekele', 24, 30, 12.0, 11.0, 134000,
   'Requested tenor extension although repayment performance remains satisfactory.',
   600, 'Rejected', 'Marta Demissie', 'Tigist Fikre', TIMESTAMPTZ '2026-08-30 15:15:00+03');

INSERT INTO loan_write_off
  (id, loan_id, loan_no, member_name, balance, writeoff_type, reason, writeoff_status,
   requested_by, approved_by, requested_at)
VALUES
  (1, 8, 'LN-2025-112', 'Selam Teshome', 7000, 'Full',
   'Member deceased; guarantors exhausted and collateral insufficient for recovery.',
   'Pending', 'Kaleab Desta', NULL, TIMESTAMPTZ '2026-09-11 10:00:00+03'),
  (2, 6, 'LN-2025-088', 'Gizachew Tulu', 20000, 'Partial',
   'Partial write-off of penalty and interest as part of negotiated settlement.',
   'Pending', 'Rahel Abebe', NULL, TIMESTAMPTZ '2026-09-09 14:30:00+03'),
  (3, 6, 'LN-2025-088', 'Gizachew Tulu', 5000, 'Partial',
   'Unrecoverable accrued interest on a restructured facility.',
   'Approved', 'Biruk Kebede', 'Sisay Worku', TIMESTAMPTZ '2026-07-22 09:10:00+03'),
  (4, 8, 'LN-2025-112', 'Selam Teshome', 0, 'Partial',
   'Zero-balance request retained for audit reference only.',
   'Rejected', 'Marta Demissie', 'Tigist Fikre', TIMESTAMPTZ '2026-07-15 12:00:00+03');

INSERT INTO loan_recovery
  (id, loan_id, loan_no, member_name, recovery_date, amount, recovery_source, recorded_by)
VALUES
  (1, 8, 'LN-2025-112', 'Selam Teshome', '2026-09-12', 2500, 'Cash', 'Kaleab Desta'),
  (2, 6, 'LN-2025-088', 'Gizachew Tulu', '2026-09-08', 4000, 'Savings', 'Rahel Abebe'),
  (3, 8, 'LN-2025-112', 'Selam Teshome', '2026-08-28', 1500, 'Cash', 'Biruk Kebede'),
  (4, 2, 'LN-2026-014', 'Hanna Girma', '2026-08-20', 3000, 'Savings', 'Marta Demissie');

INSERT INTO provision_policy (id, classification, provision_pct) VALUES
  (1, 'Pass', 1),
  (2, 'Special Mention', 5),
  (3, 'Substandard', 20),
  (4, 'Doubtful', 50),
  (5, 'Loss', 100);

INSERT INTO provision_run (id, business_date, loans_processed, total_provision, run_at, run_by) VALUES
  (1, '2026-08-31', 6, 88700, TIMESTAMPTZ '2026-08-31 18:30:00+03', 'Tigist Fikre'),
  (2, '2026-07-31', 5, 76400, TIMESTAMPTZ '2026-07-31 18:25:00+03', 'Tigist Fikre');

INSERT INTO loan_auto_debit (id, loan_id, loan_no, member_name, installment, savings_balance, debit_status) VALUES
  (1, 1, 'LN-2026-001', 'Abebe Bekele', 5583, 196000, 'Debited'),
  (2, 2, 'LN-2026-014', 'Hanna Girma', 1694, 96000, 'Debited'),
  (3, 3, 'LN-2026-027', 'Samuel Worku', 5625, 82000, 'Debited'),
  (4, 6, 'LN-2025-088', 'Gizachew Tulu', 2417, 1200, 'Insufficient'),
  (5, 8, 'LN-2025-112', 'Selam Teshome', 583, 3400, 'Debited'),
  (6, 5, 'LN-2026-038', 'Tigist Fikre', 11208, 5200, 'Insufficient');

SELECT setval(pg_get_serial_sequence('loan_restructure', 'id'), (SELECT MAX(id) FROM loan_restructure));
SELECT setval(pg_get_serial_sequence('loan_write_off', 'id'), (SELECT MAX(id) FROM loan_write_off));
SELECT setval(pg_get_serial_sequence('loan_recovery', 'id'), (SELECT MAX(id) FROM loan_recovery));
SELECT setval(pg_get_serial_sequence('provision_policy', 'id'), (SELECT MAX(id) FROM provision_policy));
SELECT setval(pg_get_serial_sequence('provision_run', 'id'), (SELECT MAX(id) FROM provision_run));
SELECT setval(pg_get_serial_sequence('loan_auto_debit', 'id'), (SELECT MAX(id) FROM loan_auto_debit));
