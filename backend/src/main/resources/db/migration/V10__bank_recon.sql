-- ============================================================
-- V10: Bank Accounts & Reconciliation
-- ============================================================

CREATE TABLE bank_account (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(30)  NOT NULL UNIQUE,
    bank_name     VARCHAR(160) NOT NULL,
    account_no    VARCHAR(40)  NOT NULL UNIQUE,
    branch        VARCHAR(120),
    currency_code VARCHAR(10)  NOT NULL DEFAULT 'ETB',
    book_balance  NUMERIC(18,2) NOT NULL DEFAULT 0,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Active',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE bank_transaction (
    id              BIGSERIAL PRIMARY KEY,
    bank_account_id BIGINT       NOT NULL REFERENCES bank_account(id),
    txn_date        DATE         NOT NULL DEFAULT CURRENT_DATE,
    ref             VARCHAR(60),
    description     VARCHAR(255),
    txn_type        VARCHAR(20)  NOT NULL DEFAULT 'Deposit',
    amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
    recon_status    VARCHAR(20)  NOT NULL DEFAULT 'Unmatched',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_bank_txn_account ON bank_transaction(bank_account_id);
CREATE INDEX idx_bank_txn_status ON bank_transaction(recon_status);

CREATE TABLE bank_recon_session (
    id                 BIGSERIAL PRIMARY KEY,
    bank_account_id    BIGINT       NOT NULL REFERENCES bank_account(id),
    bank_account_label VARCHAR(200),
    statement_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
    statement_balance  NUMERIC(18,2) NOT NULL DEFAULT 0,
    book_balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
    difference         NUMERIC(18,2) NOT NULL DEFAULT 0,
    status             VARCHAR(20)  NOT NULL DEFAULT 'Open',
    matched_count      INTEGER      NOT NULL DEFAULT 0,
    unmatched_count    INTEGER      NOT NULL DEFAULT 0,
    started_by         VARCHAR(120),
    started_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ
);
CREATE INDEX idx_bank_recon_account ON bank_recon_session(bank_account_id);
CREATE INDEX idx_bank_recon_status ON bank_recon_session(status);

INSERT INTO bank_account
  (id, code, bank_name, account_no, branch, currency_code, book_balance, status) VALUES
  (1, 'BNK-001', 'Commercial Bank of Ethiopia', '1000123456789', 'Head Office', 'ETB', 1250000.00, 'Active'),
  (2, 'BNK-002', 'Awash Bank', '0132012345678', 'Bole', 'ETB', 480000.00, 'Active'),
  (3, 'BNK-003', 'Dashen Bank', '0450012345678', 'Piassa', 'ETB', 96500.00, 'Active');

INSERT INTO bank_transaction
  (id, bank_account_id, txn_date, ref, description, txn_type, amount, recon_status) VALUES
  (1, 1, '2026-09-01', 'DEP-2026-0901', 'Member deposits batch', 'Deposit', 250000.00, 'Unmatched'),
  (2, 1, '2026-09-02', 'CHQ-100234', 'Supplier payment', 'Withdrawal', 120000.00, 'Matched'),
  (3, 1, '2026-09-03', 'DEP-2026-0903', 'Check-off collection', 'Deposit', 88000.00, 'Unmatched'),
  (4, 1, '2026-09-04', 'CHQ-100241', 'Office rent', 'Withdrawal', 45000.00, 'Excluded'),
  (5, 1, '2026-09-10', 'TRF-2026-0910', 'Loan repayment transfer', 'Deposit', 150000.00, 'Unmatched'),
  (6, 1, '2026-09-12', 'ATM-2026-0912', 'ATM charges', 'Withdrawal', 32000.00, 'Matched'),
  (7, 1, '2026-09-15', 'DEP-2026-0915', 'Share capital subscription', 'Deposit', 61000.00, 'Unmatched'),
  (8, 2, '2026-09-05', 'DEP-2026-0905', 'Bole branch deposits', 'Deposit', 90000.00, 'Matched'),
  (9, 2, '2026-09-08', 'EFT-2026-0908', 'Utility payment', 'Withdrawal', 21000.00, 'Unmatched'),
  (10, 2, '2026-09-14', 'DEP-2026-0914', 'Mobile banking collections', 'Deposit', 47000.00, 'Unmatched'),
  (11, 3, '2026-09-06', 'CHQ-100260', 'Petty cash top-up', 'Withdrawal', 15000.00, 'Excluded'),
  (12, 3, '2026-09-11', 'DEP-2026-0911', 'Dormant revival deposits', 'Deposit', 52000.00, 'Unmatched');

INSERT INTO bank_recon_session
  (id, bank_account_id, bank_account_label, statement_date, statement_balance, book_balance, difference,
   status, matched_count, unmatched_count, started_by, started_at, completed_at) VALUES
  (1, 1, 'Commercial Bank of Ethiopia • 6789', '2026-08-31', 1190000.00, 1180000.00, 10000.00,
   'Completed', 5, 0, 'Kaleab Desta', TIMESTAMPTZ '2026-09-01 09:00:00+03', TIMESTAMPTZ '2026-09-01 09:20:00+03');

SELECT setval(pg_get_serial_sequence('bank_account', 'id'), (SELECT MAX(id) FROM bank_account));
SELECT setval(pg_get_serial_sequence('bank_transaction', 'id'), (SELECT MAX(id) FROM bank_transaction));
SELECT setval(pg_get_serial_sequence('bank_recon_session', 'id'), (SELECT MAX(id) FROM bank_recon_session));
