CREATE TABLE notification_template (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(40)  NOT NULL UNIQUE,
    name         VARCHAR(160) NOT NULL,
    channel      VARCHAR(10)  NOT NULL DEFAULT 'Email',
    event        VARCHAR(60),
    subject      VARCHAR(255),
    message_body TEXT         NOT NULL,
    enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_tpl_channel ON notification_template(channel);
CREATE INDEX idx_notif_tpl_event ON notification_template(event);

INSERT INTO notification_template
  (id, code, name, channel, event, subject, message_body, enabled, updated_at) VALUES
  (1, 'TPL-DEP-001', 'Deposit Confirmation', 'Email', 'Deposit',
   'Your deposit of {{amount}} has been received',
   'Dear {{memberName}}, a deposit of {{amount}} to account {{accountNo}} was completed on {{date}}. Your new balance is {{balance}}.',
   TRUE, TIMESTAMPTZ '2026-08-14 09:15:00+03'),
  (2, 'TPL-WDL-001', 'Withdrawal Alert', 'SMS', 'Withdrawal', NULL,
   'Hi {{memberName}}, a withdrawal of {{amount}} was made from account {{accountNo}} on {{date}}. Balance: {{balance}}.',
   TRUE, TIMESTAMPTZ '2026-08-14 09:18:00+03'),
  (3, 'TPL-TRF-001', 'Transfer Notification', 'Email', 'Transfer',
   'Transfer of {{amount}} completed',
   'Dear {{memberName}}, your transfer of {{amount}} to {{beneficiary}} was successful. Reference {{reference}}.',
   TRUE, TIMESTAMPTZ '2026-08-20 11:02:00+03'),
  (4, 'TPL-LNA-001', 'Loan Approval Notice', 'Email', 'Loan Approval',
   'Your loan {{loanNo}} is approved',
   'Dear {{memberName}}, we are pleased to inform you that loan {{loanNo}} of {{amount}} has been approved. Disbursement date: {{date}}.',
   TRUE, TIMESTAMPTZ '2026-08-22 14:40:00+03'),
  (5, 'TPL-LNR-001', 'Loan Repayment Reminder', 'SMS', 'Loan Reminder', NULL,
   'Reminder: loan {{loanNo}} instalment of {{amount}} is due on {{date}}. Please ensure sufficient funds.',
   TRUE, TIMESTAMPTZ '2026-08-25 07:30:00+03'),
  (6, 'TPL-OTP-001', 'One-Time Password', 'SMS', 'OTP', NULL,
   'Your SACCO verification code is {{otp}}. It expires in {{minutes}} minutes. Never share this code.',
   FALSE, TIMESTAMPTZ '2026-09-01 06:05:00+03');

SELECT setval(pg_get_serial_sequence('notification_template', 'id'), (SELECT MAX(id) FROM notification_template));

CREATE TABLE notification_gateway_settings (
    id             BIGSERIAL PRIMARY KEY,
    smtp_host      VARCHAR(160) NOT NULL,
    smtp_port      INTEGER      NOT NULL DEFAULT 587,
    smtp_user      VARCHAR(160),
    smtp_secure    BOOLEAN      NOT NULL DEFAULT TRUE,
    sms_provider   VARCHAR(120),
    sms_sender_id  VARCHAR(60),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO notification_gateway_settings
  (id, smtp_host, smtp_port, smtp_user, smtp_secure, sms_provider, sms_sender_id, updated_at) VALUES
  (1, 'smtp.sacco.local', 587, 'notifications@sacco.local', TRUE, 'AfroMessage', 'SACCO',
   TIMESTAMPTZ '2026-08-30 10:00:00+03');

SELECT setval(pg_get_serial_sequence('notification_gateway_settings', 'id'), (SELECT MAX(id) FROM notification_gateway_settings));
