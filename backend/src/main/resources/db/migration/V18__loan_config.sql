-- ============================================================
-- V18: Loan configuration parameters
-- ============================================================

CREATE TABLE loan_config (
    id            BIGSERIAL PRIMARY KEY,
    config_key    VARCHAR(80) NOT NULL UNIQUE,
    config_value  VARCHAR(160) NOT NULL,
    value_type    VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    description   VARCHAR(300),
    config_group  VARCHAR(80) NOT NULL DEFAULT 'General'
);

INSERT INTO loan_config (id, config_key, config_value, value_type, description, config_group) VALUES
  (1, 'default_interest_rate_pct', '14', 'NUMBER', 'Default annual interest rate for new loans', 'Interest'),
  (2, 'max_loan_to_savings_ratio', '3', 'NUMBER', 'Maximum loan amount as a multiple of savings', 'Limits'),
  (3, 'min_loan_amount', '1000', 'NUMBER', 'Minimum loan amount', 'Limits'),
  (4, 'max_loan_amount', '500000', 'NUMBER', 'Maximum single loan amount', 'Limits'),
  (5, 'default_term_months', '24', 'NUMBER', 'Default loan term in months', 'Tenor'),
  (6, 'grace_period_months', '1', 'NUMBER', 'Default grace period', 'Tenor'),
  (7, 'penalty_rate_pct', '2', 'NUMBER', 'Late payment penalty rate', 'Penalty'),
  (8, 'penalty_grace_days', '5', 'NUMBER', 'Days after due date before penalty', 'Penalty'),
  (9, 'default_schedule_type', 'EQUAL_INSTALLMENT', 'TEXT', 'Default repayment schedule', 'Repayment'),
  (10, 'require_collateral_above', '100000', 'NUMBER', 'Collateral required above this amount', 'Collateral'),
  (11, 'auto_approve_below', '0', 'NUMBER', 'Auto-approve loans below this amount (0 = off)', 'Approval'),
  (12, 'provision_rate_substandard_pct', '20', 'NUMBER', 'Provision rate for substandard loans', 'Provisioning'),
  (13, 'provision_rate_doubtful_pct', '50', 'NUMBER', 'Provision rate for doubtful loans', 'Provisioning'),
  (14, 'provision_rate_loss_pct', '100', 'NUMBER', 'Provision rate for loss loans', 'Provisioning');

SELECT setval(pg_get_serial_sequence('loan_config', 'id'), (SELECT MAX(id) FROM loan_config));
