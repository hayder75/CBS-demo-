CREATE TABLE referral_code (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(20)    NOT NULL UNIQUE,
    member_id     BIGINT         NOT NULL REFERENCES member(id),
    member_name   VARCHAR(120),
    status        VARCHAR(20)    NOT NULL DEFAULT 'Active',
    uses          INTEGER        NOT NULL DEFAULT 0,
    reward_amount NUMERIC(18,2)  NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_code_member ON referral_code(member_id);
CREATE INDEX idx_referral_code_status ON referral_code(status);

CREATE TABLE referral_record (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(20)   NOT NULL,
    referrer_name  VARCHAR(120),
    referee_name   VARCHAR(120)  NOT NULL,
    referee_phone  VARCHAR(30)   NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    reward_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    qualified_at   TIMESTAMPTZ,
    rewarded_at    TIMESTAMPTZ,
    note           VARCHAR(500)
);

CREATE INDEX idx_referral_record_code ON referral_record(code);
CREATE INDEX idx_referral_record_phone ON referral_record(referee_phone);
CREATE INDEX idx_referral_record_status ON referral_record(status);

CREATE TABLE referral_settings (
    id                     BIGINT        PRIMARY KEY,
    enabled                BOOLEAN       NOT NULL DEFAULT true,
    reward_per_referral    NUMERIC(18,2) NOT NULL DEFAULT 100,
    min_qualifying_deposit NUMERIC(18,2) NOT NULL DEFAULT 500,
    reward_mode            VARCHAR(20)   NOT NULL DEFAULT 'Savings',
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

INSERT INTO referral_code (id, code, member_id, member_name, status, uses, reward_amount, created_at) VALUES
  (1, 'REF-A1B2C3', 1, 'Abebe Bekele',    'Active',   2, 100, TIMESTAMPTZ '2026-09-01 09:00:00+00'),
  (2, 'REF-D4E5F6', 2, 'Meseret Alemu',   'Active',   2, 150, TIMESTAMPTZ '2026-08-18 10:30:00+00'),
  (3, 'REF-G7H8I9', 3, 'Dawit Tesfaye',   'Active',   1, 100, TIMESTAMPTZ '2026-09-12 11:15:00+00'),
  (4, 'REF-J1K2L3', 4, 'Hanna Girma',     'Disabled', 1, 100, TIMESTAMPTZ '2026-07-22 14:00:00+00'),
  (5, 'REF-M4N5O6', 5, 'Yonas Tadesse',   'Active',   2, 100, TIMESTAMPTZ '2026-08-05 08:45:00+00'),
  (6, 'REF-P7Q8R9', 6, 'Selamawit Haile', 'Active',   1, 100, TIMESTAMPTZ '2026-10-01 09:20:00+00');

SELECT setval(pg_get_serial_sequence('referral_code', 'id'), (SELECT MAX(id) FROM referral_code));

INSERT INTO referral_record
  (id, code, referrer_name, referee_name, referee_phone, status, reward_amount, created_at, qualified_at, rewarded_at, note) VALUES
  (1, 'REF-A1B2C3', 'Abebe Bekele',    'Tigist Alemu',     '+251911000001', 'Pending',   100, TIMESTAMPTZ '2026-10-01 09:10:00+00', NULL, NULL, NULL),
  (2, 'REF-A1B2C3', 'Abebe Bekele',    'Bereket Tadesse',  '+251911000002', 'Rewarded',  100, TIMESTAMPTZ '2026-09-12 08:40:00+00', TIMESTAMPTZ '2026-09-20 10:00:00+00', TIMESTAMPTZ '2026-09-25 12:30:00+00', NULL),
  (3, 'REF-D4E5F6', 'Meseret Alemu',   'Hana Tesfaye',     '+251911000003', 'Qualified', 150, TIMESTAMPTZ '2026-10-05 11:05:00+00', TIMESTAMPTZ '2026-10-12 15:20:00+00', NULL, NULL),
  (4, 'REF-D4E5F6', 'Meseret Alemu',   'Yohannes Girma',   '+251911000004', 'Rewarded',  150, TIMESTAMPTZ '2026-09-02 13:15:00+00', TIMESTAMPTZ '2026-09-10 09:45:00+00', TIMESTAMPTZ '2026-09-15 10:10:00+00', NULL),
  (5, 'REF-G7H8I9', 'Dawit Tesfaye',   'Marta Kebede',     '+251911000005', 'Pending',   100, TIMESTAMPTZ '2026-10-09 16:25:00+00', NULL, NULL, NULL),
  (6, 'REF-G7H8I9', 'Dawit Tesfaye',   'Abel Mekonnen',    '+251911000006', 'Rejected',  100, TIMESTAMPTZ '2026-09-18 10:35:00+00', NULL, NULL, 'Referee is already an existing member of the SACCO.'),
  (7, 'REF-M4N5O6', 'Yonas Tadesse',   'Sara Bekele',      '+251911000007', 'Qualified', 100, TIMESTAMPTZ '2026-10-03 09:55:00+00', TIMESTAMPTZ '2026-10-10 14:05:00+00', NULL, NULL),
  (8, 'REF-M4N5O6', 'Yonas Tadesse',   'Nahom Assefa',     '+251911000008', 'Rewarded',  100, TIMESTAMPTZ '2026-08-22 12:00:00+00', TIMESTAMPTZ '2026-09-01 11:30:00+00', TIMESTAMPTZ '2026-09-06 09:15:00+00', NULL),
  (9, 'REF-P7Q8R9', 'Selamawit Haile', 'Ruth Solomon',     '+251911000009', 'Pending',   100, TIMESTAMPTZ '2026-10-11 08:10:00+00', NULL, NULL, NULL);

SELECT setval(pg_get_serial_sequence('referral_record', 'id'), (SELECT MAX(id) FROM referral_record));

INSERT INTO referral_settings (id, enabled, reward_per_referral, min_qualifying_deposit, reward_mode, updated_at) VALUES
  (1, true, 100, 500, 'Savings', TIMESTAMPTZ '2026-09-01 08:00:00+00');
