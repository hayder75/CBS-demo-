-- ============================================================
-- V6: Time Fixed Savings (Term Deposits / TFS)
-- ============================================================

CREATE TABLE term_deposit (
    id               BIGSERIAL PRIMARY KEY,
    account_no       VARCHAR(30)  NOT NULL UNIQUE,
    member_id        BIGINT       NOT NULL REFERENCES member(id),
    member_name      VARCHAR(160),
    product_id       BIGINT       NOT NULL REFERENCES savings_product(id),
    product_name     VARCHAR(160),
    principal        NUMERIC(18,2) NOT NULL DEFAULT 0,
    rate_pct         NUMERIC(6,3)  NOT NULL DEFAULT 0,
    term_months      INTEGER       NOT NULL DEFAULT 0,
    start_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    maturity_date    DATE          NOT NULL,
    interest_accrued NUMERIC(18,2) NOT NULL DEFAULT 0,
    maturity_value   NUMERIC(18,2) NOT NULL DEFAULT 0,
    penalty_pct      NUMERIC(6,3)  NOT NULL DEFAULT 0,
    deposit_status   VARCHAR(20)   NOT NULL DEFAULT 'Active', -- Active|Matured|Broken
    linked_account_id BIGINT REFERENCES savings_account(id),
    broken_at        TIMESTAMPTZ,
    broken_by        VARCHAR(120),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_tfs_member ON term_deposit(member_id);
CREATE INDEX idx_tfs_status ON term_deposit(deposit_status);

INSERT INTO term_deposit
  (id, account_no, member_id, member_name, product_id, product_name, principal, rate_pct, term_months,
   start_date, maturity_date, interest_accrued, maturity_value, penalty_pct, deposit_status, broken_at, broken_by) VALUES
  (1, 'TFS-2026-001', 1, 'Abebe Bekele', 4, 'Fixed-Term Deposit 12M',
   120000.00, 8.000, 12, '2026-03-01', '2027-03-01', 4800.00, 129600.00, 2.000, 'Active', NULL, NULL),
  (2, 'TFS-2026-002', 3, 'Dawit Tesfaye', 4, 'Fixed-Term Deposit 12M',
   80000.00, 7.000, 12, '2025-09-20', '2026-09-20', 5600.00, 85600.00, 3.000, 'Active', NULL, NULL),
  (3, 'TFS-2026-003', 4, 'Hanna Girma', 5, 'Fixed-Term Deposit 24M',
   300000.00, 9.500, 24, '2026-07-01', '2028-07-01', 7125.00, 357000.00, 1.500, 'Active', NULL, NULL),
  (4, 'TFS-2026-004', 6, 'Selamawit Haile', 4, 'Fixed-Term Deposit 12M',
   100000.00, 8.000, 12, '2025-08-01', '2026-08-01', 8000.00, 108000.00, 2.000, 'Matured', NULL, NULL),
  (5, 'TFS-2026-005', 7, 'Samuel Worku', 4, 'Fixed-Term Deposit 12M',
   50000.00, 7.000, 6, '2025-06-01', '2025-12-01', 1750.00, 51750.00, 2.000, 'Matured', NULL, NULL),
  (6, 'TFS-2026-006', 9, 'Natnael Mekonnen', 4, 'Fixed-Term Deposit 12M',
   60000.00, 8.000, 12, '2025-11-01', '2026-11-01', 2080.00, 62080.00, 2.000, 'Broken', '2026-05-01 10:20:00+03', 'Kaleab Desta');

SELECT setval(pg_get_serial_sequence('term_deposit', 'id'), (SELECT MAX(id) FROM term_deposit));
