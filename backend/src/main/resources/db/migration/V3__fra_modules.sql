-- ============================================================
-- V3: Franc Core Banking parity modules
-- Branches, Currencies, Payment Modes, Vaults, Accounts,
-- Share Categories, Charges, Fund Reservations, Transaction
-- Limits, Loan categories/groups/committees, Batch Jobs,
-- Fixed Assets, Payments gateway, Daily Operations, CoA classes
-- ============================================================

-- -----------------------------------------------------------
-- Admin: Branches
-- -----------------------------------------------------------
CREATE TABLE branch (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(20)  NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    address       VARCHAR(255),
    phone         VARCHAR(30),
    branch_status VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Registration: Currencies
-- -----------------------------------------------------------
CREATE TABLE currency (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(10)   NOT NULL UNIQUE,
    name            VARCHAR(80)   NOT NULL,
    notes_label     VARCHAR(20),
    cents_label     VARCHAR(20),
    exchange_rate   NUMERIC(14,6) NOT NULL DEFAULT 1,
    currency_status VARCHAR(20)   NOT NULL DEFAULT 'Pending'
);

-- -----------------------------------------------------------
-- Registration: Payment Modes (cash vs non-cash)
-- -----------------------------------------------------------
CREATE TABLE payment_mode (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30) NOT NULL UNIQUE,
    name        VARCHAR(80) NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- CASH | NON_CASH
    description VARCHAR(255),
    mode_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- -----------------------------------------------------------
-- Registration: Vaults (branch / head office / bank)
-- -----------------------------------------------------------
CREATE TABLE vault (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(30) NOT NULL UNIQUE,
    name         VARCHAR(120) NOT NULL,
    location     VARCHAR(120),
    vault_type   VARCHAR(30) NOT NULL DEFAULT 'BRANCH', -- BRANCH | HEAD | BANK
    vault_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- -----------------------------------------------------------
-- Registration: Savings / Share accounts (doc: Accounts, Shares)
-- -----------------------------------------------------------
CREATE TABLE savings_account (
    id           BIGSERIAL PRIMARY KEY,
    account_no   VARCHAR(30) NOT NULL UNIQUE,
    member_id    BIGINT NOT NULL REFERENCES member(id),
    product_id   BIGINT NOT NULL REFERENCES savings_product(id),
    account_type VARCHAR(30) DEFAULT 'Saving',
    opened_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    balance      NUMERIC(18,2) NOT NULL DEFAULT 0,
    acc_status   VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending|Active|Dormant|Closed
    currency_id  BIGINT REFERENCES currency(id),
    branch_id    BIGINT REFERENCES branch(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sacc_member ON savings_account(member_id);

CREATE TABLE signatory (
    id           BIGSERIAL PRIMARY KEY,
    account_id   BIGINT NOT NULL REFERENCES savings_account(id),
    member_id    BIGINT NOT NULL REFERENCES member(id),
    is_primary   BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE share_category (
    id                     BIGSERIAL PRIMARY KEY,
    code                   VARCHAR(20) NOT NULL UNIQUE,
    name                   VARCHAR(120) NOT NULL,
    total_shares           INTEGER NOT NULL DEFAULT 0,
    nominal_price          NUMERIC(18,2) NOT NULL DEFAULT 0,
    shares_for_sale        INTEGER NOT NULL DEFAULT 0,
    min_per_customer       INTEGER NOT NULL DEFAULT 1,
    max_per_customer       INTEGER NOT NULL DEFAULT 0,
    payment_agreement_months INTEGER NOT NULL DEFAULT 0,
    cat_status             VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE share_account (
    id               BIGSERIAL PRIMARY KEY,
    member_id        BIGINT NOT NULL REFERENCES member(id),
    category_id      BIGINT NOT NULL REFERENCES share_category(id),
    saving_account_id BIGINT REFERENCES savings_account(id),
    share_count      INTEGER NOT NULL DEFAULT 0,
    description      VARCHAR(255),
    sacc_status      VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE share_request (
    id             BIGSERIAL PRIMARY KEY,
    share_account_id BIGINT NOT NULL REFERENCES share_account(id),
    request_type   VARCHAR(20) NOT NULL, -- UPGRADE | DOWNGRADE
    share_count    INTEGER NOT NULL,
    request_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- -----------------------------------------------------------
-- Products: Charges
-- -----------------------------------------------------------
CREATE TABLE charge (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(30) NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    service_type  VARCHAR(60),
    gl_account_id BIGINT REFERENCES gl_account(id),
    calc_type     VARCHAR(20) NOT NULL DEFAULT 'Flat', -- Flat|Fixed|Percentile
    amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
    apply_penalty BOOLEAN NOT NULL DEFAULT false,
    charge_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- -----------------------------------------------------------
-- Payments: Fund Reservations (holds on accounts)
-- -----------------------------------------------------------
CREATE TABLE fund_reservation (
    id                 BIGSERIAL PRIMARY KEY,
    account_id         BIGINT NOT NULL REFERENCES savings_account(id),
    member_id          BIGINT NOT NULL REFERENCES member(id),
    amount             NUMERIC(18,2) NOT NULL,
    reason             VARCHAR(255),
    reserved_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    reserved_by        VARCHAR(120),
    reservation_status VARCHAR(20) NOT NULL DEFAULT 'Active' -- Active|Released
);

-- -----------------------------------------------------------
-- Admin: Transaction limits (role-based)
-- -----------------------------------------------------------
CREATE TABLE transaction_limit (
    id         BIGSERIAL PRIMARY KEY,
    role_code  VARCHAR(30) NOT NULL,
    txn_type   VARCHAR(30) NOT NULL, -- DEPOSIT|WITHDRAWAL|TRANSFER
    max_amount NUMERIC(18,2) NOT NULL,
    UNIQUE (role_code, txn_type)
);

-- -----------------------------------------------------------
-- Loan: Categories, Groups, Committees
-- -----------------------------------------------------------
CREATE TABLE loan_category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    cat_status  VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE loan_group (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(30) NOT NULL UNIQUE,
    name         VARCHAR(120) NOT NULL,
    max_members  INTEGER NOT NULL DEFAULT 0,
    group_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE loan_group_member (
    id          BIGSERIAL PRIMARY KEY,
    group_id    BIGINT NOT NULL REFERENCES loan_group(id),
    member_id   BIGINT NOT NULL REFERENCES member(id),
    amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
    installments INTEGER NOT NULL DEFAULT 0,
    grace_months INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE credit_committee (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    min_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
    max_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
    committee_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE committee_member (
    id           BIGSERIAL PRIMARY KEY,
    committee_id BIGINT NOT NULL REFERENCES credit_committee(id),
    user_id      BIGINT NOT NULL REFERENCES app_user(id),
    username     VARCHAR(60)
);

-- -----------------------------------------------------------
-- Loan: Batch jobs
-- -----------------------------------------------------------
CREATE TABLE batch_job (
    id          BIGSERIAL PRIMARY KEY,
    job_type    VARCHAR(40) NOT NULL,
    name        VARCHAR(120) NOT NULL,
    job_status  VARCHAR(20) NOT NULL DEFAULT 'Idle', -- Idle|Running|Done|Failed
    last_run_at TIMESTAMPTZ
);

-- -----------------------------------------------------------
-- Finance: Fixed assets (Asset Management)
-- -----------------------------------------------------------
CREATE TABLE fixed_asset (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(30) NOT NULL UNIQUE,
    name         VARCHAR(160) NOT NULL,
    value        NUMERIC(18,2) NOT NULL DEFAULT 0,
    der_rate     NUMERIC(6,3) NOT NULL DEFAULT 0,
    dpr_link     VARCHAR(40),
    gl_link      VARCHAR(40),
    branch       VARCHAR(120),
    asset_status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- -----------------------------------------------------------
-- Finance: Chart of Accounts classes + hierarchy on GL
-- -----------------------------------------------------------
CREATE TABLE gl_class (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    class_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

ALTER TABLE gl_account ADD COLUMN class_id BIGINT REFERENCES gl_class(id);
ALTER TABLE gl_account ADD COLUMN parent_id BIGINT REFERENCES gl_account(id);
ALTER TABLE gl_account ADD COLUMN side VARCHAR(10);          -- DEBIT | CREDIT
ALTER TABLE gl_account ADD COLUMN allow_debit BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE gl_account ADD COLUMN allow_credit BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE gl_account ADD COLUMN currency_code VARCHAR(10) DEFAULT 'ETB';

-- -----------------------------------------------------------
-- Payments: unified payment gateway (maker-checker)
-- -----------------------------------------------------------
CREATE TABLE payment (
    id            BIGSERIAL PRIMARY KEY,
    payment_no    VARCHAR(30) NOT NULL UNIQUE,
    kind          VARCHAR(30) NOT NULL, -- DEPOSIT|WITHDRAWAL|TRANSFER|ADJUSTMENT|BRANCH_CLAIM|MASS_TRANSFER
    member_id     BIGINT REFERENCES member(id),
    account_id    BIGINT REFERENCES savings_account(id),
    from_ref      VARCHAR(60),
    to_ref        VARCHAR(60),
    amount        NUMERIC(18,2) NOT NULL,
    payment_mode_id BIGINT REFERENCES payment_mode(id),
    description   VARCHAR(255),
    pay_status    VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending|Authorized|Rejected|Reversed
    created_by    VARCHAR(120),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    authorized_by VARCHAR(120),
    authorized_at TIMESTAMPTZ,
    reversal_of   BIGINT REFERENCES payment(id)
);
CREATE INDEX idx_payment_status ON payment(pay_status);

-- -----------------------------------------------------------
-- Payments: Daily operations (DOP open/close)
-- -----------------------------------------------------------
CREATE TABLE daily_operation (
    id          BIGSERIAL PRIMARY KEY,
    op_date     DATE NOT NULL,
    branch_id   BIGINT REFERENCES branch(id),
    vault_id    BIGINT REFERENCES vault(id),
    op_status   VARCHAR(20) NOT NULL DEFAULT 'Open', -- Open|Closed
    opened_by   VARCHAR(120),
    opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_by   VARCHAR(120),
    closed_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_daily_op ON daily_operation(op_date, branch_id) WHERE op_status = 'Open';

-- -----------------------------------------------------------
-- Extend existing tables (statuses, auth, audit fields)
-- -----------------------------------------------------------
ALTER TABLE savings_product ADD COLUMN product_status VARCHAR(20) NOT NULL DEFAULT 'Verified';
ALTER TABLE loan_product   ADD COLUMN product_status VARCHAR(20) NOT NULL DEFAULT 'Verified';
ALTER TABLE loan_product   ADD COLUMN category_id BIGINT REFERENCES loan_category(id);
ALTER TABLE loan_product   ADD COLUMN pre_payment_penalty NUMERIC(6,2) NOT NULL DEFAULT 0;
ALTER TABLE loan_product   ADD COLUMN late_payment_penalty NUMERIC(6,2) NOT NULL DEFAULT 0;
ALTER TABLE loan_product   ADD COLUMN min_installments INTEGER NOT NULL DEFAULT 1;

ALTER TABLE loan
    ADD COLUMN purpose VARCHAR(255),
    ADD COLUMN repayment_account_id BIGINT REFERENCES savings_account(id),
    ADD COLUMN reserve_account_id  BIGINT REFERENCES savings_account(id),
    ADD COLUMN group_id BIGINT REFERENCES loan_group(id),
    ADD COLUMN committee_id BIGINT REFERENCES credit_committee(id),
    ADD COLUMN decision_note VARCHAR(255),
    ADD COLUMN grace_months INTEGER NOT NULL DEFAULT 0;

ALTER TABLE savings_transaction
    ADD COLUMN pay_status VARCHAR(20) NOT NULL DEFAULT 'Authorized', -- Pending|Authorized|Rejected|Reversed
    ADD COLUMN payment_mode VARCHAR(40),
    ADD COLUMN payment_id BIGINT REFERENCES payment(id),
    ADD COLUMN audited_status VARCHAR(20) NOT NULL DEFAULT 'Unaudited', -- Unaudited|Audited|Discrepant
    ADD COLUMN audited_by VARCHAR(120),
    ADD COLUMN audited_at TIMESTAMPTZ,
    ADD COLUMN audit_note VARCHAR(255),
    ADD COLUMN reversal_of BIGINT REFERENCES savings_transaction(id);

ALTER TABLE till
    ADD COLUMN branch_id BIGINT REFERENCES branch(id),
    ADD COLUMN opened_at TIMESTAMPTZ,
    ADD COLUMN closed_at TIMESTAMPTZ;

ALTER TABLE cash_movement
    ADD COLUMN denied_by VARCHAR(120),
    ADD COLUMN denied_at TIMESTAMPTZ;