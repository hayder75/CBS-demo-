-- ============================================================
-- V4: Seed data for Franc parity modules
-- ============================================================

-- Branches
INSERT INTO branch (id, code, name, address, phone, branch_status) VALUES
  (1, 'HO', 'Head Office', 'Bole, Addis Ababa', '+251 11 551 2233', 'Verified'),
  (2, 'BL', 'Bole Branch', 'Bole Medhanialem, Addis Ababa', '+251 11 661 2244', 'Verified'),
  (3, 'PK', 'Piassa Branch', 'Piassa, Addis Ababa', '+251 11 111 8877', 'Verified'),
  (4, 'GM', 'Grand  / Mexico Branch', 'Mexico Square, Addis Ababa', '+251 11 552 9900', 'Pending');

-- Currencies
INSERT INTO currency (id, code, name, notes_label, cents_label, exchange_rate, currency_status) VALUES
  (1, 'ETB', 'Ethiopian Birr', 'Birr', 'Cents', 1.000000, 'Verified'),
  (2, 'USD', 'US Dollar', 'Dollar', 'Cents', 118.500000, 'Verified'),
  (3, 'EUR', 'Euro', 'Euro', 'Cents', 128.750000, 'Pending'),
  (4, 'GBP', 'British Pound', 'Pound', 'Pence', 150.300000, 'Pending');

-- Payment modes
INSERT INTO payment_mode (id, code, name, payment_type, description, mode_status) VALUES
  (1, 'CASH', 'Cash', 'CASH', 'Physical cash via till/vault', 'Verified'),
  (2, 'TRANSFER', 'Bank Transfer', 'NON_CASH', 'Interbank electronic transfer', 'Verified'),
  (3, 'MOBILE', 'Mobile Money', 'NON_CASH', 'Mobile money wallet', 'Verified'),
  (4, 'CHEQUE', 'Cheque', 'NON_CASH', 'Bank cheque', 'Verified'),
  (5, 'POSTAL', 'Postal Order', 'NON_CASH', 'Postal money order', 'Pending');

-- Vaults
INSERT INTO vault (id, code, name, location, vault_type, vault_status) VALUES
  (1, 'VA-HO-01', 'Head Office Main Vault', 'Head Office', 'HEAD', 'Verified'),
  (2, 'VA-BL-01', 'Bole Branch Vault', 'Bole Branch', 'BRANCH', 'Verified'),
  (3, 'VA-BK-01', 'CBE Safe Deposit', 'CBE Head Office', 'BANK', 'Verified'),
  (4, 'VA-PK-01', 'Piassa Branch Vault', 'Piassa Branch', 'BRANCH', 'Pending');

-- Share categories
INSERT INTO share_category (id, code, name, total_shares, nominal_price, shares_for_sale, min_per_customer, max_per_customer, payment_agreement_months, cat_status) VALUES
  (1, 'SH-A', 'Class A Ordinary Shares', 50000, 100.00, 48000, 20, 2000, 12, 'Verified'),
  (2, 'SH-B', 'Class B Institutional Shares', 10000, 1000.00, 9000, 10, 1000, 24, 'Verified'),
  (3, 'SH-C', 'Class C Preference Shares', 20000, 150.00, 15000, 10, 1500, 18, 'Pending');

-- GL classes
INSERT INTO gl_class (id, name, class_status) VALUES
  (1, 'Assets', 'Verified'),
  (2, 'Liabilities', 'Verified'),
  (3, 'Equity / Capital', 'Verified'),
  (4, 'Income', 'Verified'),
  (5, 'Expenses', 'Verified');

-- Update GL accounts with class/side
UPDATE gl_account SET class_id = 1, side = 'DEBIT'  WHERE id IN (1,2,3,6,14,15);
UPDATE gl_account SET class_id = 4, side = 'CREDIT' WHERE id IN (8,9);
UPDATE gl_account SET class_id = 5, side = 'DEBIT'  WHERE id IN (10,11,12,13,17);
UPDATE gl_account SET class_id = 2, side = 'CREDIT' WHERE id IN (4,5,16);
UPDATE gl_account SET class_id = 3, side = 'CREDIT' WHERE id IN (7);

-- Charges
INSERT INTO charge (id, code, name, service_type, gl_account_id, calc_type, amount, apply_penalty, charge_status) VALUES
  (1, 'CHG-SVC', 'Monthly Service Charge', 'SERVICE', 9, 'Fixed', 25.00, false, 'Verified'),
  (2, 'CHG-WDL', 'Withdrawal Fee', 'WITHDRAWAL', 9, 'Flat', 5.00, false, 'Verified'),
  (3, 'CHG-TRF', 'Transfer Fee', 'TRANSFER', 9, 'Percentile', 0.50, false, 'Verified'),
  (4, 'CHG-BOOK', 'Book Payment Service', 'BOOK', 9, 'Fixed', 50.00, true, 'Pending'),
  (5, 'CHG-PEN', 'Late Payment Penalty', 'PENALTY', 9, 'Percentile', 2.00, true, 'Verified');

-- Transaction limits (role-based)
INSERT INTO transaction_limit (id, role_code, txn_type, max_amount) VALUES
  (1, 'TELLER', 'WITHDRAWAL', 50000.00),
  (2, 'TELLER', 'TRANSFER', 100000.00),
  (3, 'TELLER', 'DEPOSIT', 200000.00),
  (4, 'CREDIT_OFFICER', 'WITHDRAWAL', 150000.00),
  (5, 'MANAGER', 'WITHDRAWAL', 500000.00),
  (6, 'MANAGER', 'TRANSFER', 1000000.00);

-- Loan categories
INSERT INTO loan_category (id, name, description, cat_status) VALUES
  (1, 'Personal', 'Personal consumption loans', 'Verified'),
  (2, 'Student', 'Education and tuition financing', 'Verified'),
  (3, 'Home', 'Home improvement and construction', 'Verified'),
  (4, 'Auto', 'Vehicle purchase financing', 'Verified'),
  (5, 'Emergency', 'Short-term emergency support', 'Pending');

-- Loan groups
INSERT INTO loan_group (id, code, name, max_members, group_status) VALUES
  (1, 'GRP-01', 'Teachers Cooperative 2026', 30, 'Verified'),
  (2, 'GRP-02', 'Band & Union Savings Circle', 25, 'Verified'),
  (3, 'GRP-03', 'Youth Enterprise Group', 20, 'Pending');

INSERT INTO loan_group_member (id, group_id, member_id, amount, installments, grace_months) VALUES
  (1, 1, 3, 50000, 12, 1),
  (2, 1, 5, 45000, 12, 1),
  (3, 2, 7, 80000, 24, 2);

-- Credit committee
INSERT INTO credit_committee (id, name, min_amount, max_amount, committee_status) VALUES
  (1, 'Main Credit Committee', 100000, 1000000, 'Verified'),
  (2, 'Small Loans Committee', 0, 100000, 'Verified'),
  (3, 'Board Credit Committee', 1000000, 99999999, 'Pending');

-- Committee members are linked to users at runtime (users are seeded by
-- DataSeeder after migrations run).

-- Batch jobs
INSERT INTO batch_job (id, job_type, name, job_status, last_run_at) VALUES
  (1, 'INTEREST_CALCULATION', 'Saving Interest Calculation', 'Done', now() - interval '1 day'),
  (2, 'INTEREST_POSTING', 'Saving Interest Posting', 'Done', now() - interval '1 day'),
  (3, 'LOAN_OPERATION', 'Run Loan Operation', 'Done', now() - interval '1 day'),
  (4, 'DEPRECIATION', 'Asset Depreciation Calculation', 'Idle', NULL),
  (5, 'COLLATERAL_INSURANCE', 'Collateral Insurance Status Check', 'Idle', NULL),
  (6, 'SAVING_STATUS', 'Regular Saving Payments & Account Status', 'Idle', NULL);

-- Fixed assets
INSERT INTO fixed_asset (id, code, name, value, der_rate, dpr_link, gl_link, branch, asset_status) VALUES
  (1, 'AST-001', 'Head Office IT Server', 850000, 20, 'G/L 3311', '1600', 'Head Office', 'Active'),
  (2, 'AST-002', 'Bole Branch Office Building', 6500000, 5, 'G/L 3312', '1600', 'Bole Branch', 'Active'),
  (3, 'AST-003', 'Fleet Vehicle - Mitsubishi L200', 2400000, 12.5, 'G/L 3313', '1600', 'Head Office', 'Active'),
  (4, 'AST-004', 'Office Furniture & Fittings', 420000, 20, 'G/L 3314', '1600', 'Piassa Branch', 'Pending');

-- Daily operation (today's open record)
INSERT INTO daily_operation (id, op_date, branch_id, vault_id, op_status, opened_by, opened_at) VALUES
  (1, CURRENT_DATE, 1, 1, 'Open', 'Sisay Worku', now());

-- Seed some savings accounts for migration parity
INSERT INTO savings_account (id, account_no, member_id, product_id, account_type, opened_date, balance, acc_status, currency_id, branch_id) VALUES
  (1, 'SA-MEM-01001-1', 1, 1, 'Saving', '2016-01-15', 84000, 'Active', 1, 1),
  (2, 'SA-MEM-01001-2', 1, 2, 'Saving', '2016-01-15', 112000, 'Active', 1, 1),
  (3, 'SA-MEM-01002-1', 2, 1, 'Saving', '2016-02-15', 86000, 'Active', 1, 2),
  (4, 'SA-MEM-01002-2', 2, 2, 'Saving', '2016-02-15', 96000, 'Active', 1, 2),
  (5, 'SA-MEM-01003-1', 3, 1, 'Saving', '2017-03-15', 82000, 'Active', 1, 2),
  (6, 'SA-MEM-01003-2', 3, 2, 'Saving', '2017-03-15', 86000, 'Active', 1, 2),
  (7, 'SA-MEM-01004-1', 4, 2, 'Saving', '2017-04-15', 159000, 'Active', 1, 3),
  (8, 'SA-MEM-01005-1', 5, 1, 'Saving', '2018-01-15', 70000, 'Active', 1, 3),
  (9, 'SA-MEM-01005-2', 5, 2, 'Saving', '2018-01-15', 82000, 'Active', 1, 3);

INSERT INTO signatory (id, account_id, member_id, is_primary) VALUES
  (1, 1, 1, true), (2, 2, 1, true), (3, 3, 2, true), (4, 4, 2, true),
  (5, 5, 3, true), (6, 6, 3, true), (7, 7, 4, true), (8, 8, 5, true), (9, 9, 5, true);

-- Seed share accounts
INSERT INTO share_account (id, member_id, category_id, saving_account_id, share_count, description, sacc_status) VALUES
  (1, 1, 1, 1, 300, 'Initial share purchase', 'Verified'),
  (2, 2, 1, 3, 288, 'Initial share purchase', 'Verified'),
  (3, 3, 1, 5, 276, 'Initial share purchase', 'Verified'),
  (4, 4, 1, 7, 264, 'Initial share purchase', 'Verified'),
  (5, 5, 1, 8, 252, 'Initial share purchase', 'Verified'),
  (6, 6, 2, NULL, 20, 'Institutional shareholding', 'Verified'),
  (7, 7, 1, NULL, 228, 'Initial share purchase', 'Pending');

-- Seed fund reservations
INSERT INTO fund_reservation (id, account_id, member_id, amount, reason, reserved_at, reserved_by, reservation_status) VALUES
  (1, 3, 2, 15000, 'Loan collateral hold - pending disbursement', now() - interval '2 days', 'Biruk Kebede', 'Active'),
  (2, 2, 1, 5000, 'Membership fee deduction', now() - interval '5 days', 'Kaleab Desta', 'Active');

-- Seed payment-mode-linked sample payments (authorized history)
INSERT INTO payment (id, payment_no, kind, member_id, account_id, from_ref, to_ref, amount, payment_mode_id, description, pay_status, created_by, created_at, authorized_by, authorized_at) VALUES
  (1, 'PMT-0000001', 'DEPOSIT', 1, 1, 'CASH', 'SA-MEM-01001-1', 5000, 1, 'Cash deposit', 'Authorized', 'Kaleab Desta', now() - interval '1 day', 'Tigist Fikre', now() - interval '1 day'),
  (2, 'PMT-0000002', 'WITHDRAWAL', 2, 3, 'SA-MEM-01002-1', 'CASH', 3000, 1, 'Cash withdrawal', 'Authorized', 'Rahel Abebe', now() - interval '1 day', 'Tigist Fikre', now() - interval '1 day'),
  (3, 'PMT-0000003', 'TRANSFER', 3, 5, 'SA-MEM-01003-1', 'SA-MEM-01003-2', 20000, 3, 'Saving to saving transfer', 'Pending', 'Kaleab Desta', now(), NULL, NULL);

-- Advance identity sequences past the seeded explicit ids so subsequent
-- inserts do not collide.
SELECT setval(pg_get_serial_sequence('branch', 'id'), (SELECT MAX(id) FROM branch));
SELECT setval(pg_get_serial_sequence('currency', 'id'), (SELECT MAX(id) FROM currency));
SELECT setval(pg_get_serial_sequence('payment_mode', 'id'), (SELECT MAX(id) FROM payment_mode));
SELECT setval(pg_get_serial_sequence('vault', 'id'), (SELECT MAX(id) FROM vault));
SELECT setval(pg_get_serial_sequence('share_category', 'id'), (SELECT MAX(id) FROM share_category));
SELECT setval(pg_get_serial_sequence('charge', 'id'), (SELECT MAX(id) FROM charge));
SELECT setval(pg_get_serial_sequence('gl_class', 'id'), (SELECT MAX(id) FROM gl_class));
SELECT setval(pg_get_serial_sequence('loan_category', 'id'), (SELECT MAX(id) FROM loan_category));
SELECT setval(pg_get_serial_sequence('loan_group', 'id'), (SELECT MAX(id) FROM loan_group));
SELECT setval(pg_get_serial_sequence('loan_group_member', 'id'), (SELECT MAX(id) FROM loan_group_member));
SELECT setval(pg_get_serial_sequence('credit_committee', 'id'), (SELECT MAX(id) FROM credit_committee));
SELECT setval(pg_get_serial_sequence('batch_job', 'id'), (SELECT MAX(id) FROM batch_job));
SELECT setval(pg_get_serial_sequence('fixed_asset', 'id'), (SELECT MAX(id) FROM fixed_asset));
SELECT setval(pg_get_serial_sequence('savings_account', 'id'), (SELECT MAX(id) FROM savings_account));
SELECT setval(pg_get_serial_sequence('signatory', 'id'), (SELECT MAX(id) FROM signatory));
SELECT setval(pg_get_serial_sequence('share_account', 'id'), (SELECT MAX(id) FROM share_account));
SELECT setval(pg_get_serial_sequence('fund_reservation', 'id'), (SELECT MAX(id) FROM fund_reservation));
SELECT setval(pg_get_serial_sequence('transaction_limit', 'id'), (SELECT MAX(id) FROM transaction_limit));
SELECT setval(pg_get_serial_sequence('payment', 'id'), (SELECT MAX(id) FROM payment));
SELECT setval(pg_get_serial_sequence('daily_operation', 'id'), (SELECT MAX(id) FROM daily_operation));