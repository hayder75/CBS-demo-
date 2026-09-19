-- ============================================================
-- V11: GL Posting Rules / Product-to-COA mapping
-- ============================================================

CREATE TABLE gl_posting_rule (
    id                  BIGSERIAL PRIMARY KEY,
    event               VARCHAR(60)  NOT NULL,
    description         VARCHAR(255),
    product_type        VARCHAR(30)  NOT NULL,
    debit_account_code  VARCHAR(30)  NOT NULL,
    credit_account_code VARCHAR(30)  NOT NULL,
    rule_status         VARCHAR(20)  NOT NULL DEFAULT 'Active'
);
CREATE INDEX idx_gl_posting_rule_event ON gl_posting_rule(event);

INSERT INTO gl_posting_rule
  (id, event, description, product_type, debit_account_code, credit_account_code, rule_status)
VALUES
  (1, 'SAVINGS_DEPOSIT', 'Cash deposit into member savings account', 'Savings', '1000', '1200', 'Active'),
  (2, 'SAVINGS_WITHDRAWAL', 'Member savings withdrawal paid over the counter', 'Savings', '1200', '1000', 'Active'),
  (3, 'LOAN_DISBURSEMENT', 'Loan principal disbursed to a member', 'Loan', '1400', '1000', 'Active'),
  (4, 'LOAN_REPAYMENT', 'Loan principal and interest repayment received', 'Loan', '1000', '1400', 'Active'),
  (5, 'LOAN_INTEREST_ACCRUAL', 'Interest income accrual on outstanding loans', 'Loan', '1400', '2000', 'Inactive'),
  (6, 'SHARE_PURCHASE', 'Member share capital subscription', 'Share', '1000', '1300', 'Active'),
  (7, 'DIVIDEND_POSTING', 'Dividend declared and credited to member savings', 'Share', '1500', '1201', 'Inactive'),
  (8, 'FEE_INCOME', 'Service and processing fee income recognized', 'Fee', '1000', '2100', 'Active'),
  (9, 'TREASURY_BANK_TRANSFER', 'Cash transferred from vault to bank account', 'Treasury', '1100', '1000', 'Active'),
  (10, 'EXPENSE_PAYMENT', 'Operating expense paid from cash on hand', 'Expense', '3000', '1000', 'Active');

SELECT setval(pg_get_serial_sequence('gl_posting_rule', 'id'), (SELECT MAX(id) FROM gl_posting_rule));
