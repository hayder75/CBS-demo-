-- ============================================================
-- V12: Fee Waivers - maker-checker waivers of charges and fees
-- ============================================================

CREATE TABLE fee_waiver (
    id           BIGSERIAL PRIMARY KEY,
    member_id    BIGINT       NOT NULL REFERENCES member(id),
    member_name  VARCHAR(160),
    charge_code  VARCHAR(30)  NOT NULL,
    charge_name  VARCHAR(160),
    date_from    DATE         NOT NULL,
    date_to      DATE         NOT NULL,
    amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
    reason       VARCHAR(500),
    waiver_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    requested_by VARCHAR(120),
    approved_by  VARCHAR(120),
    requested_at TIMESTAMPTZ,
    decided_at   TIMESTAMPTZ
);
CREATE INDEX idx_fee_waiver_member ON fee_waiver(member_id);
CREATE INDEX idx_fee_waiver_status ON fee_waiver(waiver_status);

INSERT INTO fee_waiver
  (id, member_id, member_name, charge_code, charge_name, date_from, date_to, amount,
   reason, waiver_status, requested_by, approved_by, requested_at, decided_at)
VALUES
  (1, 1, 'Abebe Bekele', 'CHG-SVC', 'Monthly Service Charge', '2026-08-01', '2026-08-31', 25.00,
   'Long-serving pensioner; August service fee waived on compassionate grounds.',
   'Approved', 'Kaleab Desta', 'Tigist Fikre',
   TIMESTAMPTZ '2026-08-02 09:15:00+03', TIMESTAMPTZ '2026-08-02 14:20:00+03'),
  (2, 2, 'Meseret Alemu', 'CHG-WDL', 'Withdrawal Fee', '2026-09-01', '2026-09-30', 5.00,
   'First withdrawal of the month for a member in good standing.',
   'Pending', 'Rahel Abebe', NULL,
   TIMESTAMPTZ '2026-09-05 10:40:00+03', NULL),
  (3, 3, 'Dawit Tesfaye', 'CHG-PEN', 'Late Payment Penalty', '2026-06-01', '2026-06-30', 1200.00,
   'Penalty waiver after documented medical emergency and early settlement.',
   'Approved', 'Biruk Kebede', 'Tigist Fikre',
   TIMESTAMPTZ '2026-07-03 08:30:00+03', TIMESTAMPTZ '2026-07-03 16:05:00+03'),
  (4, 4, 'Hanna Girma', 'CHG-SVC', 'Monthly Service Charge', '2026-07-01', '2026-07-31', 300.00,
   'Institutional account service charge waiver for a dormant reactivated account.',
   'Approved', 'Marta Demissie', 'Sisay Worku',
   TIMESTAMPTZ '2026-07-01 11:00:00+03', TIMESTAMPTZ '2026-07-02 09:10:00+03'),
  (5, 5, 'Yonas Tadesse', 'CHG-WDL', 'Withdrawal Fee', '2026-08-10', '2026-08-10', 50.00,
   'Requested waiver on multiple over-the-counter withdrawals.',
   'Rejected', 'Rahel Abebe', 'Tigist Fikre',
   TIMESTAMPTZ '2026-08-10 13:25:00+03', TIMESTAMPTZ '2026-08-11 08:00:00+03'),
  (6, 6, 'Selamawit Haile', 'CHG-PEN', 'Late Payment Penalty', '2026-09-01', '2026-09-30', 800.00,
   'Waiver requested by the branch while the member is on deployment.',
   'Pending', 'Tigist Fikre', NULL,
   TIMESTAMPTZ '2026-09-08 09:45:00+03', NULL);

SELECT setval(pg_get_serial_sequence('fee_waiver', 'id'), (SELECT MAX(id) FROM fee_waiver));
