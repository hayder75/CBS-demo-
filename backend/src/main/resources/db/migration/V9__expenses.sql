-- ============================================================
-- V9: Expenses - categories, GL mapping and postings
-- ============================================================

CREATE TABLE expense_category (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(40)  NOT NULL UNIQUE,
    name            VARCHAR(160) NOT NULL,
    gl_account_code VARCHAR(20)  NOT NULL,
    cat_status      VARCHAR(20)  NOT NULL DEFAULT 'Pending' -- Pending|Verified
);
CREATE INDEX idx_expense_category_status ON expense_category(cat_status);

CREATE TABLE expense_entry (
    id              BIGSERIAL PRIMARY KEY,
    expense_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
    category_id     BIGINT        NOT NULL REFERENCES expense_category(id),
    category_name   VARCHAR(160),
    description     VARCHAR(500),
    amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
    payment_mode    VARCHAR(40),
    gl_account_code VARCHAR(20),
    posted_by       VARCHAR(120),
    entry_status    VARCHAR(20)   NOT NULL DEFAULT 'Posted' -- Posted|Reversed
);
CREATE INDEX idx_expense_entry_date ON expense_entry(expense_date);
CREATE INDEX idx_expense_entry_category ON expense_entry(category_id);

INSERT INTO expense_category (id, code, name, gl_account_code, cat_status) VALUES
  (1, 'EXP-SAL',  'Staff Salaries',              '3000', 'Verified'),
  (2, 'EXP-RENT', 'Office Rent',                 '3100', 'Verified'),
  (3, 'EXP-UTIL', 'Utilities & Communication',   '3200', 'Pending'),
  (4, 'EXP-PROV', 'Provision for Loan Losses',   '3300', 'Pending');

INSERT INTO expense_entry
  (id, expense_date, category_id, category_name, description, amount, payment_mode, gl_account_code, posted_by, entry_status) VALUES
  (1, '2026-09-02', 1, 'Staff Salaries', 'August staff salaries',            342000.00, 'Cash',          '3000', 'Kaleab Desta',  'Posted'),
  (2, '2026-09-03', 2, 'Office Rent',    'September office rent',            120000.00, 'Bank Transfer', '3100', 'Tigist Fikre',  'Posted'),
  (3, '2026-09-05', 1, 'Staff Salaries', 'Overtime allowance for tellers',    18500.00, 'Cash',          '3000', 'Kaleab Desta',  'Posted'),
  (4, '2026-09-06', 2, 'Office Rent',    'Duplicate rent payment',           120000.00, 'Bank Transfer', '3100', 'Kaleab Desta',  'Reversed'),
  (5, '2026-08-28', 1, 'Staff Salaries', 'August salaries - batch 1',        338000.00, 'Cash',          '3000', 'Marta Demissie','Posted'),
  (6, '2026-09-08', 1, 'Staff Salaries', 'Contract cleaner wages',             9500.00, 'Cash',          '3000', 'Kaleab Desta',  'Posted'),
  (7, '2026-08-15', 2, 'Office Rent',    'August office rent',               120000.00, 'Check',         '3100', 'Tigist Fikre',  'Posted'),
  (8, '2026-09-09', 2, 'Office Rent',    'Parking space rent',                15000.00, 'Digital',       '3100', 'Kaleab Desta',  'Posted');

SELECT setval(pg_get_serial_sequence('expense_category', 'id'), (SELECT MAX(id) FROM expense_category));
SELECT setval(pg_get_serial_sequence('expense_entry', 'id'), (SELECT MAX(id) FROM expense_entry));
