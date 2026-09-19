-- ============================================================
-- V7: Membership Applications (join SACCO -> pay -> approve)
-- ============================================================

CREATE TABLE membership_application (
    id                       BIGSERIAL PRIMARY KEY,
    application_no           VARCHAR(30)  NOT NULL UNIQUE,
    applicant_type           VARCHAR(20)  NOT NULL DEFAULT 'Individual', -- Individual | Entity
    full_name                VARCHAR(160) NOT NULL,
    fayda_id                 VARCHAR(40),
    phone                    VARCHAR(30),
    email                    VARCHAR(120),
    employer                 VARCHAR(160),
    branch                   VARCHAR(120),
    share_product_id         BIGINT REFERENCES share_category(id),
    share_count              INTEGER      NOT NULL DEFAULT 0,
    compulsory_product_id    BIGINT REFERENCES savings_product(id),
    entrance_fee             NUMERIC(18,2) NOT NULL DEFAULT 0,
    registration_fee         NUMERIC(18,2) NOT NULL DEFAULT 0,
    payment_status           VARCHAR(20)  NOT NULL DEFAULT 'Unpaid', -- Unpaid | Paid
    channel                  VARCHAR(20)  NOT NULL DEFAULT 'Staff',  -- Staff | Portal
    app_status               VARCHAR(20)  NOT NULL DEFAULT 'Pending', -- Pending | Approved | Rejected
    submitted_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    decided_by               VARCHAR(120),
    decided_at               TIMESTAMPTZ,
    reject_reason            VARCHAR(255),
    created_member_id        BIGINT REFERENCES member(id),
    created_share_account_id BIGINT REFERENCES share_account(id)
);
CREATE INDEX idx_memapp_status ON membership_application(app_status);
CREATE INDEX idx_memapp_payment ON membership_application(payment_status);

INSERT INTO membership_application
  (id, application_no, applicant_type, full_name, fayda_id, phone, email, employer, branch,
   share_product_id, share_count, compulsory_product_id, entrance_fee, registration_fee,
   payment_status, channel, app_status, submitted_at, decided_by, decided_at, reject_reason,
   created_member_id, created_share_account_id) VALUES
  (1, 'APP-2026-001', 'Individual', 'Mekdes Asrat', 'FAY-4820193377', '+251 911 204 887',
   'mekdes.asrat@gmail.com', 'Ethio Telecom', 'Bole Branch', 1, 40, 1, 200.00, 50.00,
   'Paid', 'Staff', 'Pending', '2026-09-04 09:12:00+03', NULL, NULL, NULL, NULL, NULL),
  (2, 'APP-2026-002', 'Individual', 'Kalkidan Wolde', 'FAY-5512340987', '+251 912 778 341',
   'kalkidan.wolde@gmail.com', NULL, 'Piassa Branch', 1, 25, 1, 200.00, 50.00,
   'Unpaid', 'Portal', 'Pending', '2026-09-05 13:45:00+03', NULL, NULL, NULL, NULL, NULL),
  (3, 'APP-2026-003', 'Entity', 'Bright Future Trading PLC', NULL, '+251 11 662 4410',
   'info@brightfuture.et', 'Bright Future Trading PLC', 'Head Office', 2, 15, NULL, 200.00, 50.00,
   'Unpaid', 'Staff', 'Pending', '2026-09-06 08:03:00+03', NULL, NULL, NULL, NULL, NULL),
  (4, 'APP-2026-004', 'Individual', 'Bereket Nigussie', 'FAY-7734102288', '+251 913 556 902',
   'bereket.nigussie@gmail.com', 'Addis Ababa University', 'Bole Branch', 1, 60, 1, 200.00, 50.00,
   'Paid', 'Staff', 'Approved', '2026-08-28 10:20:00+03', 'Tigist Fikre', '2026-08-29 11:00:00+03',
   NULL, 4, 2),
  (5, 'APP-2026-005', 'Individual', 'Tsion Gebremariam', 'FAY-9900187632', '+251 914 320 118',
   NULL, NULL, 'Grand / Mexico Branch', 1, 30, NULL, 200.00, 50.00,
   'Unpaid', 'Portal', 'Rejected', '2026-08-27 15:30:00+03', 'Tigist Fikre', '2026-08-28 09:05:00+03',
   'Fayda ID details could not be verified.', NULL, NULL);

SELECT setval(pg_get_serial_sequence('membership_application', 'id'), (SELECT MAX(id) FROM membership_application));
