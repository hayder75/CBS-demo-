-- ============================================================
-- V22: AI-assisted loan scoring (policy, factors, bands, snapshots, runs)
-- ============================================================

CREATE TABLE scoring_policy (
    id                      BIGSERIAL PRIMARY KEY,
    version                 INTEGER      NOT NULL,
    name                    VARCHAR(120) NOT NULL,
    active                  BOOLEAN      NOT NULL DEFAULT false,
    effective_from          DATE         NOT NULL DEFAULT CURRENT_DATE,
    min_score_auto_approve  NUMERIC(5,2) NOT NULL DEFAULT 75,
    min_score_refer         NUMERIC(5,2) NOT NULL DEFAULT 55,
    max_loan_to_savings     NUMERIC(8,2) NOT NULL DEFAULT 3,
    base_interest_pct       NUMERIC(6,2) NOT NULL DEFAULT 14,
    max_amount              NUMERIC(18,2) NOT NULL DEFAULT 500000,
    notes                   VARCHAR(400),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO scoring_policy (id, version, name, active, min_score_auto_approve, min_score_refer, max_loan_to_savings, base_interest_pct, max_amount, notes) VALUES
  (1, 1, 'Anchor Scorecard v1', true, 75, 55, 3, 14, 500000, 'Initial explainable scorecard policy');

SELECT setval(pg_get_serial_sequence('scoring_policy', 'id'), (SELECT MAX(id) FROM scoring_policy));

CREATE TABLE scoring_factor (
    id           BIGSERIAL PRIMARY KEY,
    policy_id    BIGINT       NOT NULL REFERENCES scoring_policy(id) ON DELETE CASCADE,
    code         VARCHAR(60)  NOT NULL,
    name         VARCHAR(120) NOT NULL,
    weight       NUMERIC(6,2) NOT NULL DEFAULT 1,
    direction    VARCHAR(20)  NOT NULL DEFAULT 'POSITIVE',
    description  VARCHAR(300),
    sort_order   INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO scoring_factor (policy_id, code, name, weight, direction, description, sort_order) VALUES
  (1, 'savings_consistency', 'Savings consistency',       1.5, 'POSITIVE', 'Regular deposits and stable average balance', 1),
  (1, 'savings_growth',      'Savings growth',            1.0, 'POSITIVE', 'Momentum of savings balance over time', 2),
  (1, 'share_capital',       'Share capital',             1.0, 'POSITIVE', 'Committed share capital held', 3),
  (1, 'repayment_history',   'Repayment history',         2.0, 'POSITIVE', 'On-time repayment and absence of arrears', 4),
  (1, 'affordability',       'Affordability',             1.5, 'POSITIVE', 'Debt burden relative to savings/income', 5),
  (1, 'tenure',              'Membership tenure',         0.8, 'POSITIVE', 'Length of active membership', 6),
  (1, 'collateral',          'Collateral coverage',       1.0, 'POSITIVE', 'Pledged collateral vs requested amount', 7),
  (1, 'kyc',                 'KYC completeness',          0.5, 'POSITIVE', 'Identity and KYC documentation complete', 8);

CREATE TABLE scoring_band (
    id           BIGSERIAL PRIMARY KEY,
    policy_id    BIGINT       NOT NULL REFERENCES scoring_policy(id) ON DELETE CASCADE,
    grade        VARCHAR(4)   NOT NULL,
    min_score    NUMERIC(5,2) NOT NULL,
    max_score    NUMERIC(5,2) NOT NULL,
    pd_pct       NUMERIC(6,2) NOT NULL,
    interest_pct NUMERIC(6,2) NOT NULL
);

INSERT INTO scoring_band (policy_id, grade, min_score, max_score, pd_pct, interest_pct) VALUES
  (1, 'A', 85, 100, 1.5, 12),
  (1, 'B', 70, 84.99, 3.5, 14),
  (1, 'C', 55, 69.99, 8, 16),
  (1, 'D', 40, 54.99, 18, 19),
  (1, 'E', 0, 39.99, 35, 22);

CREATE TABLE member_feature_snapshot (
    id                     BIGSERIAL PRIMARY KEY,
    member_id              BIGINT       NOT NULL UNIQUE,
    savings_avg_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
    deposit_freq_monthly   NUMERIC(8,2)  NOT NULL DEFAULT 0,
    savings_growth_pct     NUMERIC(8,2)  NOT NULL DEFAULT 0,
    share_balance          NUMERIC(18,2) NOT NULL DEFAULT 0,
    on_time_pct            NUMERIC(6,2)  NOT NULL DEFAULT 100,
    arrears_days           INTEGER       NOT NULL DEFAULT 0,
    par_ratio              NUMERIC(6,2)  NOT NULL DEFAULT 0,
    dti_pct                NUMERIC(8,2)  NOT NULL DEFAULT 0,
    loan_to_savings        NUMERIC(8,2)  NOT NULL DEFAULT 0,
    tenure_months          INTEGER       NOT NULL DEFAULT 0,
    collateral_coverage_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
    guarantor_score        NUMERIC(6,2)  NOT NULL DEFAULT 60,
    kyc_complete           BOOLEAN       NOT NULL DEFAULT true,
    computed_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE score_run (
    id                 BIGSERIAL PRIMARY KEY,
    member_id          BIGINT       NOT NULL,
    loan_id            BIGINT,
    policy_id          BIGINT       NOT NULL REFERENCES scoring_policy(id),
    score              NUMERIC(5,2) NOT NULL,
    grade              VARCHAR(4)   NOT NULL,
    pd_pct             NUMERIC(6,2) NOT NULL,
    decision           VARCHAR(30)  NOT NULL,
    recommended_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    recommended_term   INTEGER      NOT NULL DEFAULT 0,
    interest_pct       NUMERIC(6,2) NOT NULL DEFAULT 0,
    narration          VARCHAR(1000),
    factors_json       TEXT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by         VARCHAR(160),
    override_decision  VARCHAR(30),
    override_reason    VARCHAR(400),
    override_by        VARCHAR(160),
    override_at        TIMESTAMPTZ
);
CREATE INDEX idx_score_run_member ON score_run(member_id);
