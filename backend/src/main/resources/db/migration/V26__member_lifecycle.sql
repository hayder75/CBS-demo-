CREATE TABLE member_custom_field (
    id           BIGSERIAL PRIMARY KEY,
    field_key    VARCHAR(80)   NOT NULL UNIQUE,
    label        VARCHAR(120)  NOT NULL,
    field_type   VARCHAR(20)   NOT NULL,
    applies_to   VARCHAR(20)   NOT NULL DEFAULT 'Both',
    required     BOOLEAN       NOT NULL DEFAULT false,
    options      VARCHAR(1000),
    status       VARCHAR(20)   NOT NULL DEFAULT 'Active',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_custom_field_status ON member_custom_field(status);

CREATE TABLE member_custom_value (
    id          BIGSERIAL PRIMARY KEY,
    member_id   BIGINT        NOT NULL REFERENCES member(id),
    field_id    BIGINT        NOT NULL REFERENCES member_custom_field(id),
    field_key   VARCHAR(80)   NOT NULL,
    label       VARCHAR(120)  NOT NULL,
    field_type  VARCHAR(20)   NOT NULL,
    value       VARCHAR(1000),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_member_custom_value UNIQUE (member_id, field_id)
);

CREATE INDEX idx_member_custom_value_member ON member_custom_value(member_id);

CREATE TABLE member_exit_request (
    id            BIGSERIAL PRIMARY KEY,
    member_id     BIGINT        NOT NULL REFERENCES member(id),
    member_name   VARCHAR(120)  NOT NULL,
    member_no     VARCHAR(20)   NOT NULL,
    reason        VARCHAR(500)  NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    requested_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    decided_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_member_exit_request_member ON member_exit_request(member_id);
CREATE INDEX idx_member_exit_request_status ON member_exit_request(status);

CREATE TABLE member_exit_checklist (
    id                BIGSERIAL PRIMARY KEY,
    exit_request_id   BIGINT       NOT NULL REFERENCES member_exit_request(id) ON DELETE CASCADE,
    item_key          VARCHAR(60)  NOT NULL,
    label             VARCHAR(160) NOT NULL,
    done              BOOLEAN      NOT NULL DEFAULT false,
    note              VARCHAR(500),
    sort_order        INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_member_exit_checklist_request ON member_exit_checklist(exit_request_id);

CREATE TABLE dormancy_policy (
    id                  BIGINT      PRIMARY KEY,
    months              INTEGER     NOT NULL DEFAULT 12,
    auto_flag_members   BOOLEAN     NOT NULL DEFAULT true,
    auto_flag_accounts  BOOLEAN     NOT NULL DEFAULT true,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO member_custom_field (id, field_key, label, field_type, applies_to, required, options, status, created_at) VALUES
  (1, 'tin',             'TIN',             'Text',    'Both',       false, NULL,                                      'Active', TIMESTAMPTZ '2026-01-05 08:00:00+00'),
  (2, 'passport_no',     'Passport No',     'Text',    'Individual', false, NULL,                                      'Active', TIMESTAMPTZ '2026-01-05 08:05:00+00'),
  (3, 'marital_status',  'Marital Status',  'Select',  'Both',       false, 'Single,Married,Divorced,Widowed',          'Active', TIMESTAMPTZ '2026-01-05 08:10:00+00'),
  (4, 'source_of_funds', 'Source of Funds', 'Select',  'Both',       false, 'Salary,Business,Savings,Investment,Other', 'Active', TIMESTAMPTZ '2026-01-05 08:15:00+00'),
  (5, 'pep',             'PEP',             'Boolean', 'Individual', false, NULL,                                      'Active', TIMESTAMPTZ '2026-01-05 08:20:00+00');

SELECT setval(pg_get_serial_sequence('member_custom_field', 'id'), (SELECT MAX(id) FROM member_custom_field));

INSERT INTO member_custom_value (id, member_id, field_id, field_key, label, field_type, value, updated_at) VALUES
  (1, 1, 1, 'tin',             'TIN',             'Text',    '1234567890', TIMESTAMPTZ '2026-02-01 09:00:00+00'),
  (2, 1, 2, 'passport_no',     'Passport No',     'Text',    'EP1234567',  TIMESTAMPTZ '2026-02-01 09:00:00+00'),
  (3, 1, 3, 'marital_status',  'Marital Status',  'Select',  'Married',    TIMESTAMPTZ '2026-02-01 09:00:00+00'),
  (4, 1, 4, 'source_of_funds', 'Source of Funds', 'Select',  'Salary',     TIMESTAMPTZ '2026-02-01 09:00:00+00'),
  (5, 1, 5, 'pep',             'PEP',             'Boolean', 'false',      TIMESTAMPTZ '2026-02-01 09:00:00+00'),
  (6, 2, 1, 'tin',             'TIN',             'Text',    '9876543210', TIMESTAMPTZ '2026-02-03 10:30:00+00'),
  (7, 2, 3, 'marital_status',  'Marital Status',  'Select',  'Single',     TIMESTAMPTZ '2026-02-03 10:30:00+00'),
  (8, 2, 4, 'source_of_funds', 'Source of Funds', 'Select',  'Business',   TIMESTAMPTZ '2026-02-03 10:30:00+00'),
  (9, 2, 5, 'pep',             'PEP',             'Boolean', 'true',       TIMESTAMPTZ '2026-02-03 10:30:00+00');

SELECT setval(pg_get_serial_sequence('member_custom_value', 'id'), (SELECT MAX(id) FROM member_custom_value));

INSERT INTO member_exit_request (id, member_id, member_name, member_no, reason, status, requested_at, decided_at, completed_at) VALUES
  (1, 5,  'Yonas Tadesse',    'MEM-01005', 'Relocating abroad for work and closing the membership.',   'Pending',   TIMESTAMPTZ '2026-10-02 09:15:00+00', NULL, NULL),
  (2, 18, 'Robel Hailemariam', 'MEM-01018', 'Voluntary withdrawal after relocating to another region.', 'Completed', TIMESTAMPTZ '2026-08-12 11:00:00+00', TIMESTAMPTZ '2026-08-15 14:30:00+00', TIMESTAMPTZ '2026-08-20 10:00:00+00');

SELECT setval(pg_get_serial_sequence('member_exit_request', 'id'), (SELECT MAX(id) FROM member_exit_request));

INSERT INTO member_exit_checklist (id, exit_request_id, item_key, label, done, sort_order) VALUES
  (1,  1, 'savings_withdrawn', 'Savings withdrawn',          true,  0),
  (2,  1, 'loans_settled',     'Loans fully settled',        true,  1),
  (3,  1, 'shares_transferred', 'Shares transferred',        false, 2),
  (4,  1, 'collateral_released', 'Collateral released',      false, 3),
  (5,  1, 'guarantor_cleared', 'Guarantor exposure cleared', false, 4),
  (6,  1, 'kyc_retained',      'KYC retained',               true,  5),
  (7,  2, 'savings_withdrawn', 'Savings withdrawn',          true,  0),
  (8,  2, 'loans_settled',     'Loans fully settled',        true,  1),
  (9,  2, 'shares_transferred', 'Shares transferred',        true,  2),
  (10, 2, 'collateral_released', 'Collateral released',      true,  3),
  (11, 2, 'guarantor_cleared', 'Guarantor exposure cleared', true,  4),
  (12, 2, 'kyc_retained',      'KYC retained',               true,  5);

SELECT setval(pg_get_serial_sequence('member_exit_checklist', 'id'), (SELECT MAX(id) FROM member_exit_checklist));

INSERT INTO dormancy_policy (id, months, auto_flag_members, auto_flag_accounts, updated_at) VALUES
  (1, 12, true, true, TIMESTAMPTZ '2026-09-01 08:00:00+00');

UPDATE member SET status = 'Withdrawn' WHERE id = 18;
