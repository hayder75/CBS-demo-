-- ============================================================
-- V21: Member KYC flags, document attachments, admin messages
-- ============================================================

ALTER TABLE member ADD COLUMN has_photo    BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE member ADD COLUMN has_signature BOOLEAN    NOT NULL DEFAULT true;
ALTER TABLE member ADD COLUMN kyc_status   VARCHAR(20) NOT NULL DEFAULT 'Verified';

UPDATE member SET has_photo = false WHERE id % 7 = 0;
UPDATE member SET has_signature = false WHERE id % 5 = 0;
UPDATE member SET kyc_status = 'Pending' WHERE id % 6 = 0;
UPDATE member SET kyc_status = 'KycWaiting' WHERE id % 10 = 0;

CREATE TABLE document_attachment (
    id               BIGSERIAL PRIMARY KEY,
    document_type_id BIGINT       NOT NULL REFERENCES document_type(id),
    entity_type      VARCHAR(40)  NOT NULL,
    entity_id        VARCHAR(60)  NOT NULL,
    file_name        VARCHAR(240) NOT NULL,
    mime_type        VARCHAR(80)  NOT NULL DEFAULT 'application/pdf',
    size_kb          INTEGER      NOT NULL DEFAULT 0,
    uploaded_by      VARCHAR(160),
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    attach_status    VARCHAR(20)  NOT NULL DEFAULT 'Active'
);
CREATE INDEX idx_document_attachment_entity ON document_attachment(entity_type, entity_id);

CREATE TABLE message (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    body            VARCHAR(2000),
    category        VARCHAR(40)  NOT NULL DEFAULT 'General',
    audience        VARCHAR(60)  NOT NULL DEFAULT 'All',
    channel         VARCHAR(30)  NOT NULL DEFAULT 'In-App',
    message_status  VARCHAR(20)  NOT NULL DEFAULT 'Draft',
    created_by      VARCHAR(160),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ
);

INSERT INTO message (id, title, body, category, audience, channel, message_status, created_by, created_at, sent_at) VALUES
  (1, 'Liquidity ratio below policy', 'The liquidity ratio has fallen below the 20% policy floor. Please review the cash position.', 'Risk', 'MANAGER', 'In-App', 'Sent', 'Workineh', TIMESTAMPTZ '2026-09-20 09:10:00+03', TIMESTAMPTZ '2026-09-20 09:10:00+03'),
  (2, 'Month-end close reminder', 'All tellers must close their tills before the end-of-month close on 7th.', 'Operations', 'TELLER', 'In-App', 'Sent', 'Workineh', TIMESTAMPTZ '2026-09-28 16:00:00+03', TIMESTAMPTZ '2026-09-28 16:00:00+03'),
  (3, 'Loan arrears follow-up', 'PAR has increased this month. Loan officers to follow up on 30+ day arrears.', 'Credit', 'LOAN_OFFICER', 'Email', 'Draft', 'Workineh', TIMESTAMPTZ '2026-09-29 11:30:00+03', NULL);

SELECT setval(pg_get_serial_sequence('message', 'id'), (SELECT MAX(id) FROM message));
