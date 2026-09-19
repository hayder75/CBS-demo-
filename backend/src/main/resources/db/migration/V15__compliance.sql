-- ============================================================
-- V15: Compliance - prudential policy thresholds
-- ============================================================

CREATE TABLE compliance_policy (
    id                BIGSERIAL PRIMARY KEY,
    liquidity_min_pct NUMERIC(5,2) NOT NULL DEFAULT 20,
    exposure_max_pct  NUMERIC(5,2) NOT NULL DEFAULT 25,
    updated_at        TIMESTAMP
);

INSERT INTO compliance_policy (id, liquidity_min_pct, exposure_max_pct, updated_at)
VALUES (1, 20, 25, NOW());

SELECT setval(pg_get_serial_sequence('compliance_policy', 'id'), (SELECT MAX(id) FROM compliance_policy));
