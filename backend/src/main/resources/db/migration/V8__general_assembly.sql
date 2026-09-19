-- ============================================================
-- V8: General Assembly Resolutions - Dividends & Reserves
-- ============================================================

CREATE TABLE ga_resolution (
    id                 BIGSERIAL PRIMARY KEY,
    ref                VARCHAR(30)   NOT NULL UNIQUE,
    fin_year           INTEGER       NOT NULL,
    total_surplus      NUMERIC(18,2) NOT NULL DEFAULT 0,
    dividend_pct       NUMERIC(7,2)  NOT NULL DEFAULT 0,
    reserve_pct        NUMERIC(7,2)  NOT NULL DEFAULT 0,
    distributable      NUMERIC(18,2) NOT NULL DEFAULT 0,
    dividend_per_share NUMERIC(18,2) NOT NULL DEFAULT 0,
    eligible_members   INTEGER       NOT NULL DEFAULT 0,
    total_dividend     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_reserve      NUMERIC(18,2) NOT NULL DEFAULT 0,
    resolution_status  VARCHAR(20)   NOT NULL DEFAULT 'Draft',
    created_by         VARCHAR(120),
    approved_by        VARCHAR(120),
    created_at         TIMESTAMPTZ,
    approved_at        TIMESTAMPTZ,
    executed_at        TIMESTAMPTZ,
    note               VARCHAR(500)
);
CREATE INDEX idx_ga_resolution_year ON ga_resolution(fin_year);

-- 2024 resolution: executed
INSERT INTO ga_resolution
  (id, ref, fin_year, total_surplus, dividend_pct, reserve_pct, distributable,
   dividend_per_share, eligible_members, total_dividend, total_reserve,
   resolution_status, created_by, approved_by, created_at, approved_at, executed_at, note)
VALUES
  (1, 'GA-2024-1', 2024, 5200000, 60, 15, 3900000, 6.84, 20, 3120000, 780000,
   'Executed', 'Marta Demissie', 'Tigist Fikre',
   TIMESTAMPTZ '2024-12-20 09:30:00+03', TIMESTAMPTZ '2025-01-10 10:15:00+03', TIMESTAMPTZ '2025-01-20 08:00:00+03',
   'Approved by the 2024 General Assembly; dividends credited to withdrawable accounts.');

-- 2025 resolution: executed
INSERT INTO ga_resolution
  (id, ref, fin_year, total_surplus, dividend_pct, reserve_pct, distributable,
   dividend_per_share, eligible_members, total_dividend, total_reserve,
   resolution_status, created_by, approved_by, created_at, approved_at, executed_at, note)
VALUES
  (2, 'GA-2025-1', 2025, 5800000, 65, 15, 4640000, 8.27, 20, 3770000, 870000,
   'Executed', 'Marta Demissie', 'Tigist Fikre',
   TIMESTAMPTZ '2025-12-18 09:00:00+03', TIMESTAMPTZ '2026-01-08 11:20:00+03', TIMESTAMPTZ '2026-01-18 08:30:00+03',
   'Reserve top-up funded from prior year retained earnings.');

-- 2026 resolution: draft proposal
INSERT INTO ga_resolution
  (id, ref, fin_year, total_surplus, dividend_pct, reserve_pct, distributable,
   dividend_per_share, eligible_members, total_dividend, total_reserve,
   resolution_status, created_by, approved_by, created_at, approved_at, executed_at, note)
VALUES
  (3, 'GA-2026-1', 2026, 6400000, 60, 15, 4800000, 8.42, 20, 3840000, 960000,
   'Draft', 'Marta Demissie', NULL,
   TIMESTAMPTZ '2026-09-01 09:00:00+03', NULL, NULL,
   'Proposed distribution pending board review and General Assembly approval.');

SELECT setval(pg_get_serial_sequence('ga_resolution', 'id'), (SELECT MAX(id) FROM ga_resolution));
