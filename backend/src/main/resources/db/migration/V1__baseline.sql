-- CBS General — SACCO Management System baseline schema

-- ============================================================
-- Auth & RBAC (§11, §15)
-- ============================================================
CREATE TABLE role (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL
);

CREATE TABLE app_user (
    id           BIGSERIAL PRIMARY KEY,
    username     VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name    VARCHAR(120) NOT NULL,
    title        VARCHAR(120),
    branch       VARCHAR(120),
    role_id      BIGINT       NOT NULL REFERENCES role(id),
    last_login_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permission (
    id        BIGSERIAL PRIMARY KEY,
    role_id   BIGINT NOT NULL REFERENCES role(id),
    code      VARCHAR(60) NOT NULL,
    UNIQUE (role_id, code)
);

-- ============================================================
-- Members (§3)
-- ============================================================
CREATE TABLE member (
    id               BIGSERIAL PRIMARY KEY,
    member_no        VARCHAR(20) NOT NULL UNIQUE,
    full_name        VARCHAR(120) NOT NULL,
    gender           VARCHAR(1)   NOT NULL,
    birth_date       DATE,
    phone            VARCHAR(30),
    email            VARCHAR(120),
    fayda_id         VARCHAR(40),
    kebele           VARCHAR(80),
    woreda           VARCHAR(80),
    city             VARCHAR(80),
    occupation       VARCHAR(120),
    employer         VARCHAR(160),
    status           VARCHAR(20) NOT NULL DEFAULT 'Active',
    join_date        DATE,
    share_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
    savings_balance  NUMERIC(18,2) NOT NULL DEFAULT 0,
    loan_outstanding NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_member_name ON member(full_name);
CREATE INDEX idx_member_status ON member(status);
CREATE INDEX idx_member_fayda ON member(fayda_id);

CREATE TABLE next_of_kin (
    id        BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES member(id),
    full_name VARCHAR(120) NOT NULL,
    relation  VARCHAR(60),
    phone     VARCHAR(30)
);

CREATE TABLE beneficiary (
    id        BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES member(id),
    full_name VARCHAR(120) NOT NULL,
    relation  VARCHAR(60),
    phone     VARCHAR(30),
    percent   NUMERIC(5,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- Savings (§4)
-- ============================================================
CREATE TABLE savings_product (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(20) NOT NULL UNIQUE,
    name              VARCHAR(120) NOT NULL,
    product_type      VARCHAR(20) NOT NULL,
    interest_rate_pct NUMERIC(6,3) NOT NULL DEFAULT 0,
    min_balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
    notice_period_days INTEGER
);

CREATE TABLE savings_transaction (
    id         BIGSERIAL PRIMARY KEY,
    member_id  BIGINT NOT NULL REFERENCES member(id),
    product_id BIGINT NOT NULL REFERENCES savings_product(id),
    txn_date   DATE NOT NULL,
    txn_type   VARCHAR(20) NOT NULL,
    amount     NUMERIC(18,2) NOT NULL,
    teller     VARCHAR(120),
    channel    VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_st_member ON savings_transaction(member_id);

-- ============================================================
-- Loans (§5)
-- ============================================================
CREATE TABLE loan_product (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(20) NOT NULL UNIQUE,
    name              VARCHAR(120) NOT NULL,
    rate_pct          NUMERIC(6,3) NOT NULL,
    max_term_months   INTEGER NOT NULL,
    max_amount        NUMERIC(18,2) NOT NULL,
    schedule          VARCHAR(30) NOT NULL,
    processing_fee_pct NUMERIC(6,3) NOT NULL DEFAULT 0
);

CREATE TABLE loan (
    id              BIGSERIAL PRIMARY KEY,
    loan_no         VARCHAR(30) NOT NULL UNIQUE,
    member_id       BIGINT NOT NULL REFERENCES member(id),
    product_id      BIGINT NOT NULL REFERENCES loan_product(id),
    loan_status     VARCHAR(30) NOT NULL DEFAULT 'Pending',
    amount          NUMERIC(18,2) NOT NULL,
    disbursed_at    DATE,
    term_months     INTEGER NOT NULL,
    rate_pct        NUMERIC(6,3) NOT NULL,
    schedule_type   VARCHAR(30) NOT NULL,
    principal_paid  NUMERIC(18,2) NOT NULL DEFAULT 0,
    interest_paid   NUMERIC(18,2) NOT NULL DEFAULT 0,
    balance         NUMERIC(18,2) NOT NULL DEFAULT 0,
    overdue_days    INTEGER NOT NULL DEFAULT 0,
    classification  VARCHAR(30) NOT NULL DEFAULT 'Pass',
    ai_score        INTEGER,
    ai_pd_pct       NUMERIC(6,3),
    ai_guidance     VARCHAR(160),
    next_due_date   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loan_member ON loan(member_id);
CREATE INDEX idx_loan_status ON loan(loan_status);

CREATE TABLE guarantor (
    id               BIGSERIAL PRIMARY KEY,
    loan_id          BIGINT NOT NULL REFERENCES loan(id),
    member_id        BIGINT REFERENCES member(id),
    name             VARCHAR(120) NOT NULL,
    exposure         NUMERIC(18,2) NOT NULL DEFAULT 0,
    pledged_deposit  NUMERIC(18,2) NOT NULL DEFAULT 0,
    guarantor_status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- ============================================================
-- Accounting (§6)
-- ============================================================
CREATE TABLE gl_account (
    id       BIGSERIAL PRIMARY KEY,
    code     VARCHAR(20) NOT NULL UNIQUE,
    name     VARCHAR(160) NOT NULL,
    category VARCHAR(20) NOT NULL,
    balance  NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE journal_entry (
    id           BIGSERIAL PRIMARY KEY,
    jrn_date     DATE NOT NULL,
    ref_no       VARCHAR(40) NOT NULL,
    description  VARCHAR(255),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(160),
    debit        NUMERIC(18,2) NOT NULL DEFAULT 0,
    credit       NUMERIC(18,2) NOT NULL DEFAULT 0,
    posted_by    VARCHAR(120),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Check-Off (§7)
-- ============================================================
CREATE TABLE checkoff_batch (
    id         BIGSERIAL PRIMARY KEY,
    employer   VARCHAR(160) NOT NULL,
    batch_month VARCHAR(20) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    row_count  INTEGER NOT NULL DEFAULT 0,
    matched    INTEGER NOT NULL DEFAULT 0,
    unmatched  INTEGER NOT NULL DEFAULT 0,
    expected   NUMERIC(18,2) NOT NULL DEFAULT 0,
    received   NUMERIC(18,2) NOT NULL DEFAULT 0,
    variance   NUMERIC(18,2) NOT NULL DEFAULT 0,
    batch_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- ============================================================
-- Collateral (§8)
-- ============================================================
CREATE TABLE collateral (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(30) NOT NULL UNIQUE,
    asset_type        VARCHAR(60) NOT NULL,
    owner_name        VARCHAR(120) NOT NULL,
    description       VARCHAR(255),
    valuation         NUMERIC(18,2) NOT NULL DEFAULT 0,
    forced_sale_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_pct      NUMERIC(6,2) NOT NULL DEFAULT 0,
    loan_id           BIGINT REFERENCES loan(id),
    loan_ref          VARCHAR(30),
    insurance_expiry  DATE,
    coll_status       VARCHAR(30) NOT NULL DEFAULT 'Pledged'
);

-- ============================================================
-- Shares & Dividends (§9)
-- ============================================================
CREATE TABLE share_transfer (
    id           BIGSERIAL PRIMARY KEY,
    transfer_date DATE NOT NULL,
    from_member  VARCHAR(120) NOT NULL,
    to_member    VARCHAR(120) NOT NULL,
    share_count  INTEGER NOT NULL,
    amount       NUMERIC(18,2) NOT NULL,
    transfer_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE dividend_run (
    id                 BIGSERIAL PRIMARY KEY,
    fin_year           VARCHAR(10) NOT NULL UNIQUE,
    total_surplus      NUMERIC(18,2) NOT NULL DEFAULT 0,
    statutory_reserve  NUMERIC(18,2) NOT NULL DEFAULT 0,
    distributable      NUMERIC(18,2) NOT NULL DEFAULT 0,
    eligible_members   INTEGER NOT NULL DEFAULT 0,
    dividend_per_share NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_distribution NUMERIC(18,2) NOT NULL DEFAULT 0,
    dividend_status    VARCHAR(20) NOT NULL DEFAULT 'Proposed'
);

-- ============================================================
-- Cash & Branch Operations (§13)
-- ============================================================
CREATE TABLE till (
    id          BIGSERIAL PRIMARY KEY,
    teller_name VARCHAR(120) NOT NULL,
    opening     NUMERIC(18,2) NOT NULL DEFAULT 0,
    deposits    NUMERIC(18,2) NOT NULL DEFAULT 0,
    withdrawals NUMERIC(18,2) NOT NULL DEFAULT 0,
    closing     NUMERIC(18,2) NOT NULL DEFAULT 0,
    expected    NUMERIC(18,2) NOT NULL DEFAULT 0,
    variance    NUMERIC(18,2) NOT NULL DEFAULT 0,
    till_status VARCHAR(20) NOT NULL DEFAULT 'Open'
);

CREATE TABLE cash_movement (
    id           BIGSERIAL PRIMARY KEY,
    movement_date DATE NOT NULL,
    from_location VARCHAR(120) NOT NULL,
    to_location   VARCHAR(120) NOT NULL,
    amount        NUMERIC(18,2) NOT NULL,
    initiated_by  VARCHAR(120) NOT NULL,
    approved_by   VARCHAR(120),
    movement_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    movement_type VARCHAR(40) NOT NULL
);

CREATE TABLE petty_cash (
    id          BIGSERIAL PRIMARY KEY,
    entry_date  DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category    VARCHAR(80),
    amount      NUMERIC(18,2) NOT NULL,
    receipt_no  VARCHAR(30),
    pc_status   VARCHAR(20) NOT NULL DEFAULT 'Open'
);

-- ============================================================
-- Approvals (maker-checker) & Notifications (§10, §11)
-- ============================================================
CREATE TABLE approval (
    id           BIGSERIAL PRIMARY KEY,
    approval_type VARCHAR(40) NOT NULL,
    ref_no       VARCHAR(40) NOT NULL,
    summary      VARCHAR(255),
    amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
    initiated_by VARCHAR(120) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_by  VARCHAR(120),
    decided_at   TIMESTAMPTZ
);

CREATE TABLE notification (
    id          BIGSERIAL PRIMARY KEY,
    member_id   BIGINT REFERENCES member(id),
    member_name VARCHAR(120),
    channel     VARCHAR(10) NOT NULL,
    notif_type  VARCHAR(40),
    message     VARCHAR(500),
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Audit trail (§11)
-- ============================================================
CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(60),
    action     VARCHAR(60) NOT NULL,
    entity     VARCHAR(80),
    entity_id  VARCHAR(40),
    detail     VARCHAR(500),
    ip_address VARCHAR(60),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);