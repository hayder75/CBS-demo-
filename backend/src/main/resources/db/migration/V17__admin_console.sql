-- ============================================================
-- V17: Administration console (holidays, user groups, device access, org profile)
-- ============================================================

CREATE TABLE holiday (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(160) NOT NULL,
    holiday_date  DATE         NOT NULL,
    recurring     BOOLEAN      NOT NULL DEFAULT false,
    holiday_type  VARCHAR(30)  NOT NULL DEFAULT 'Public',
    description   VARCHAR(300),
    holiday_status VARCHAR(20) NOT NULL DEFAULT 'Active'
);
CREATE INDEX idx_holiday_date ON holiday(holiday_date);

INSERT INTO holiday (id, name, holiday_date, recurring, holiday_type, description, holiday_status) VALUES
  (1, 'Ethiopian New Year (Enkutatash)', DATE '2026-09-11', false, 'Public', 'Start of the Ethiopian year', 'Active'),
  (2, 'Meskel', DATE '2026-09-27', false, 'Public', 'Finding of the True Cross', 'Active'),
  (3, 'Ethiopian Christmas (Genna)', DATE '2027-01-07', true, 'Public', 'Orthodox Christmas', 'Active'),
  (4, 'Timket', DATE '2027-01-19', true, 'Public', 'Epiphany', 'Active'),
  (5, 'Labour Day', DATE '2027-05-01', true, 'Public', 'International Workers'' Day', 'Active'),
  (6, 'Financial Year End Close', DATE '2027-07-07', true, 'Internal', 'Books closed for the fiscal year', 'Active');

SELECT setval(pg_get_serial_sequence('holiday', 'id'), (SELECT MAX(id) FROM holiday));

CREATE TABLE user_group (
    id                     BIGSERIAL PRIMARY KEY,
    name                   VARCHAR(120) NOT NULL,
    code                   VARCHAR(60)  NOT NULL UNIQUE,
    max_login_attempts     INTEGER      NOT NULL DEFAULT 5,
    multiple_machine_logins BOOLEAN     NOT NULL DEFAULT false,
    branch_specific        BOOLEAN      NOT NULL DEFAULT false,
    multiple_users         BOOLEAN      NOT NULL DEFAULT true,
    description            VARCHAR(300),
    permissions            TEXT         NOT NULL DEFAULT '',
    group_status           VARCHAR(20)  NOT NULL DEFAULT 'Verified'
);

INSERT INTO user_group (id, name, code, max_login_attempts, multiple_machine_logins, branch_specific, multiple_users, description, permissions, group_status) VALUES
  (1, 'Super Admin', 'SUPER_ADMIN', 10, true, false, true, 'Full system access', 'members,accounts,shares,loans,finance,payments,reports,audit,admin', 'Verified'),
  (2, 'Admin', 'ADMIN', 5, false, false, true, 'System administrator', 'members,accounts,shares,loans,finance,payments,reports,audit,admin', 'Verified'),
  (3, 'Manager', 'MANAGER', 5, false, true, true, 'Branch manager', 'members,accounts,shares,loans,finance,payments,reports,audit', 'Verified'),
  (4, 'Cashier', 'CASHIER', 5, false, true, true, 'Teller / cashier', 'members,accounts,payments', 'Verified'),
  (5, 'Customer Service Officer', 'CSO', 5, false, true, true, 'Front office', 'members,accounts,shares', 'Verified'),
  (6, 'Accountant', 'ACCOUNTANT', 5, false, false, true, 'Finance officer', 'finance,accounts,reports', 'Verified'),
  (7, 'Loan Officer', 'LOAN_OFFICER', 5, false, true, true, 'Credit officer', 'members,loans,collateral', 'Verified'),
  (8, 'Auditor', 'AUDITOR', 5, false, false, true, 'Internal auditor', 'reports,audit', 'Verified');

SELECT setval(pg_get_serial_sequence('user_group', 'id'), (SELECT MAX(id) FROM user_group));

CREATE TABLE device_access (
    id           BIGSERIAL PRIMARY KEY,
    username     VARCHAR(120) NOT NULL,
    device_name  VARCHAR(160),
    device_id    VARCHAR(160),
    ip_address   VARCHAR(60),
    location     VARCHAR(160),
    authorized   BOOLEAN      NOT NULL DEFAULT false,
    last_seen    TIMESTAMPTZ,
    access_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);
CREATE INDEX idx_device_access_user ON device_access(username);

INSERT INTO device_access (id, username, device_name, device_id, ip_address, location, authorized, last_seen, access_status) VALUES
  (1, 'workineh-wss', 'Dell OptiPlex 7090', 'DEV-A1B2C3', '10.10.4.21', 'ATOTE BRANCH', true,  TIMESTAMPTZ '2026-09-22 19:40:00+03', 'Authorized'),
  (2, 'kabine-wss', 'HP ProDesk 400', 'DEV-D4E5F6', '10.10.4.22', 'AREBSEFER', true, TIMESTAMPTZ '2026-09-22 18:10:00+03', 'Authorized'),
  (3, 'meront-wss', 'Lenovo ThinkCentre', 'DEV-778899', '10.10.4.10', 'ATOTE BRANCH', true, TIMESTAMPTZ '2026-09-22 19:55:00+03', 'Authorized'),
  (4, 'unknown', 'Unknown Device', 'DEV-000000', '196.188.10.7', 'External', false, TIMESTAMPTZ '2026-09-20 02:14:00+03', 'Blocked');

SELECT setval(pg_get_serial_sequence('device_access', 'id'), (SELECT MAX(id) FROM device_access));

CREATE TABLE org_profile (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(160) NOT NULL,
    legal_name         VARCHAR(200),
    registration_no    VARCHAR(80),
    tin                VARCHAR(40),
    phone              VARCHAR(40),
    email              VARCHAR(120),
    address            VARCHAR(240),
    city               VARCHAR(120),
    country            VARCHAR(120),
    currency_code      VARCHAR(10)  NOT NULL DEFAULT 'ETB',
    fiscal_year_start  VARCHAR(20)  NOT NULL DEFAULT 'Hamle 1',
    logo_color         VARCHAR(20)  NOT NULL DEFAULT '#0e7a5f',
    org_status         VARCHAR(20)  NOT NULL DEFAULT 'Active'
);

INSERT INTO org_profile (id, name, legal_name, registration_no, tin, phone, email, address, city, country, currency_code, fiscal_year_start, logo_color, org_status) VALUES
  (1, 'Test MFI', 'Test Microfinance Institution S.C.', 'REG-MFI-0001', 'TIN-0001234567', '+251 11 555 0100', 'info@testmfi.et', 'Bole Road, Kirkos', 'Addis Ababa', 'Ethiopia', 'ETB', 'Hamle 1', '#0e7a5f', 'Active');

SELECT setval(pg_get_serial_sequence('org_profile', 'id'), (SELECT MAX(id) FROM org_profile));
