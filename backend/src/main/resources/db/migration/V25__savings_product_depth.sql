ALTER TABLE savings_product
    ADD COLUMN IF NOT EXISTS interest_method VARCHAR(40) NOT NULL DEFAULT 'Daily Outstanding',
    ADD COLUMN IF NOT EXISTS maintenance_fee NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS maintenance_fee_frequency VARCHAR(20) NOT NULL DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS passbook_fee NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overdraft_allowed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS overdraft_limit NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS auto_create BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS compulsory BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS lock_in_months INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gl_liability_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gl_interest_expense_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gl_fee_income_code VARCHAR(20);

UPDATE savings_product
SET compulsory = true,
    auto_create = true,
    interest_method = 'Daily Outstanding'
WHERE product_type = 'Mandatory';

UPDATE savings_product
SET lock_in_months = 12,
    interest_method = 'Minimum Balance'
WHERE product_type = 'Fixed' AND lock_in_months = 0;

UPDATE savings_product
SET gl_liability_code = CASE WHEN product_type = 'Mandatory' THEN '1200' ELSE '1201' END,
    gl_interest_expense_code = '2000',
    gl_fee_income_code = '2100'
WHERE gl_liability_code IS NULL
   OR gl_interest_expense_code IS NULL
   OR gl_fee_income_code IS NULL;
