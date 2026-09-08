-- ============================================================
-- Roles & permissions (§15)
-- ============================================================
INSERT INTO role (id, code, name) VALUES
  (1, 'ADMIN', 'System Administrator'),
  (2, 'MANAGER', 'Manager'),
  (3, 'TELLER', 'Teller / Cashier'),
  (4, 'CREDIT_OFFICER', 'Credit Officer'),
  (5, 'ACCOUNTANT', 'Accountant / Finance Officer'),
  (6, 'AUDITOR', 'Auditor');

INSERT INTO role_permission (role_id, code) VALUES
  (1, 'users:manage'), (1, 'system:config'), (1, 'audit:read'), (1, 'approvals:manage'),
  (2, 'approvals:manage'), (2, 'reports:read'), (2, 'cashops:manage'), (2, 'members:read'),
  (3, 'savings:transact'), (3, 'tills:manage'), (3, 'members:read'), (3, 'loans:read'),
  (4, 'loans:manage'), (4, 'loans:appraise'), (4, 'collateral:manage'), (4, 'members:read'),
  (5, 'accounting:manage'), (5, 'checkoff:manage'), (5, 'closing:execute'), (5, 'shares:manage'),
  (6, 'audit:read'), (6, 'members:read'), (6, 'accounting:read'), (6, 'loans:read');

-- ============================================================
-- Savings products (§4)
-- ============================================================
INSERT INTO savings_product (id, code, name, product_type, interest_rate_pct, min_balance, notice_period_days) VALUES
  (1, 'S-MAND', 'Mandatory Monthly Savings', 'Mandatory', 5.0, 1200, NULL),
  (2, 'S-VOL', 'Voluntary Withdrawable Savings', 'Voluntary', 6.0, 0, NULL),
  (3, 'S-HOL', 'Holiday / Target Savings', 'Holiday', 6.5, 0, NULL),
  (4, 'S-FIX-12', 'Fixed-Term Deposit 12M', 'Fixed', 8.0, 5000, 12),
  (5, 'S-FIX-24', 'Fixed-Term Deposit 24M', 'Fixed', 9.5, 5000, 24);

-- ============================================================
-- Loan products (§5)
-- ============================================================
INSERT INTO loan_product (id, code, name, rate_pct, max_term_months, max_amount, schedule, processing_fee_pct) VALUES
  (1, 'L-PER', 'Personal Loan', 12.0, 36, 300000, 'Reducing Balance', 1.0),
  (2, 'L-EDU', 'Education Loan', 10.5, 48, 200000, 'Reducing Balance', 0.5),
  (3, 'L-HOU', 'Home Improvement Loan', 11.0, 60, 500000, 'Straight-Line', 1.0),
  (4, 'L-EME', 'Emergency Loan', 13.0, 12, 80000, 'Flat Rate', 0.5),
  (5, 'L-VEH', 'Vehicle Loan', 11.5, 48, 900000, 'Reducing Balance', 1.5);

-- ============================================================
-- Chart of Accounts (§6)
-- ============================================================
INSERT INTO gl_account (id, code, name, category, balance) VALUES
  (1, '1000', 'Cash on Hand', 'Asset', 1245000.00),
  (2, '1100', 'Bank - CBE Current Account', 'Asset', 8620000.00),
  (3, '1200', 'Member Savings - Mandatory', 'Liability', -8400000.00),
  (4, '1201', 'Member Savings - Voluntary', 'Liability', -6000000.00),
  (5, '1300', 'Member Share Capital', 'Equity', -4820000.00),
  (6, '1400', 'Loan Portfolio - Outstanding', 'Asset', 1068000.00),
  (7, '1500', 'Statutory Reserve', 'Equity', -1560000.00),
  (8, '2000', 'Interest Income - Loans', 'Income', -713600.00),
  (9, '2100', 'Processing Fees Income', 'Income', -98000.00),
  (10, '3000', 'Staff Salaries', 'Expense', 342000.00),
  (11, '3100', 'Office Rent', 'Expense', 120000.00),
  (12, '3200', 'Utilities & Communication', 'Expense', 46000.00),
  (13, '3300', 'Provision for Loan Losses', 'Expense', 78000.00),
  (14, '1410', 'Interest Receivable', 'Asset', 24600.00),
  (15, '1600', 'Investments & Fixed Assets', 'Asset', 10048000.00),
  (16, '2200', 'Accrued Interest Payable', 'Liability', -12400.00),
  (17, '3310', 'Interest Expense - Member Savings', 'Expense', 12400.00);

-- ============================================================
-- Members (§3)
-- ============================================================
INSERT INTO member (id, member_no, full_name, gender, birth_date, phone, email, fayda_id, kebele, woreda, city, occupation, employer, status, join_date, share_balance, savings_balance, loan_outstanding) VALUES
  (1, 'MEM-01001', 'Abebe Bekele', 'M', '1985-04-12', '+251 91 222 3441', 'abebe.bekele@gmail.com', 'FAY-1122334455', 'Bole 01', 'Woreda 3', 'Addis Ababa', 'Aircraft Technician', 'Ethiopian Airlines', 'Active', '2016-01-15', 30000, 196000, 134000),
  (2, 'MEM-01002', 'Meseret Alemu', 'F', '1990-08-03', '+251 91 222 3442', 'meseret.alemu@gmail.com', 'FAY-9988776655', 'Kirkos 03', 'Woreda 2', 'Addis Ababa', 'Banker', 'Commercial Bank of Ethiopia', 'Active', '2016-02-15', 28800, 182000, 0),
  (3, 'MEM-01003', 'Dawit Tesfaye', 'M', '1982-11-20', '+251 91 222 3443', 'dawit.tesfaye@gmail.com', 'FAY-5544332211', 'Yeka 08', 'Woreda 9', 'Addis Ababa', 'Engineer', 'Ethio Telecom', 'Active', '2017-03-15', 27600, 168000, 0),
  (4, 'MEM-01004', 'Hanna Girma', 'F', '1988-02-14', '+251 91 222 3444', 'hanna.girma@gmail.com', 'FAY-6677889900', 'Arada 02', 'Woreda 1', 'Addis Ababa', 'Lecturer', 'Addis Ababa University', 'Dormant', '2017-04-15', 26400, 159000, 61000),
  (5, 'MEM-01005', 'Yonas Tadesse', 'M', '1991-06-25', '+251 91 222 3445', 'yonas.tadesse@gmail.com', 'FAY-1122446688', 'Nifas Silk-Lafto 09', 'Woreda 7', 'Addis Ababa', 'IT Specialist', 'Ethio Telecom', 'Active', '2018-01-15', 25200, 152000, 0),
  (6, 'MEM-01006', 'Selamawit Haile', 'F', '1984-09-30', '+251 91 222 3446', 'selamawit.haile@gmail.com', 'FAY-3355779911', 'Kolfe Keranio 11', 'Woreda 8', 'Addis Ababa', 'Pharmacist', 'Ministry of Education', 'Active', '2018-02-15', 24000, 146000, 0),
  (7, 'MEM-01007', 'Samuel Worku', 'M', '1987-12-05', '+251 91 222 3447', 'samuel.worku@gmail.com', 'FAY-2468135790', 'Gulele 05', 'Woreda 4', 'Addis Ababa', 'Civil Servant', 'Ministry of Finance', 'Active', '2019-03-15', 22800, 138000, 270000),
  (8, 'MEM-01008', 'Frehiwot Negash', 'F', '1993-03-17', '+251 91 222 3448', 'frehiwot.negash@gmail.com', 'FAY-1357246890', 'Lideta 06', 'Woreda 5', 'Addis Ababa', 'Nurse', 'Ministry of Education', 'Active', '2019-04-15', 21600, 131000, 0),
  (9, 'MEM-01009', 'Natnael Mekonnen', 'M', '1995-07-08', '+251 91 222 3449', 'natnael.mekonnen@gmail.com', 'FAY-9090909090', 'Akaki Kality 14', 'Woreda 12', 'Addis Ababa', 'Driver', 'Ethiopian Airlines', 'Active', '2020-01-15', 20400, 124000, 0),
  (10, 'MEM-01010', 'Liya Getachew', 'F', '1989-10-22', '+251 91 222 3450', 'liya.getachew@gmail.com', 'FAY-1212121212', 'Addis Ketema 04', 'Woreda 3', 'Addis Ababa', 'Accountant', 'Dashen Bank', 'Active', '2020-02-15', 19200, 118000, 0),
  (11, 'MEM-01011', 'Henok Assefa', 'M', '1986-01-11', '+251 91 222 3451', 'henok.assefa@gmail.com', 'FAY-3434343434', 'Bole 01', 'Woreda 3', 'Addis Ababa', 'Teacher', 'Ministry of Education', 'Active', '2021-03-15', 18000, 112000, 0),
  (12, 'MEM-01012', 'Tigist Fikre', 'F', '1983-05-19', '+251 91 222 3452', 'tigist.fikre@gmail.com', 'FAY-5656565656', 'Kirkos 03', 'Woreda 2', 'Addis Ababa', 'Administrator', 'Commercial Bank of Ethiopia', 'Active', '2021-04-15', 16800, 106000, 538000),
  (13, 'MEM-01013', 'Elias Mulugeta', 'M', '1992-02-27', '+251 91 222 3453', 'elias.mulugeta@gmail.com', 'FAY-7878787878', 'Yeka 08', 'Woreda 9', 'Addis Ababa', 'Engineer', 'EEP (Ethiopian Electric Power)', 'Suspended', '2022-01-15', 15600, 98000, 0),
  (14, 'MEM-01014', 'Bethlehem Admassu', 'F', '1994-08-09', '+251 91 222 3454', 'bethlehem.admassu@gmail.com', 'FAY-1010101010', 'Arada 02', 'Woreda 1', 'Addis Ababa', 'IT Specialist', 'Ethio Telecom', 'Active', '2022-02-15', 14400, 92000, 0),
  (15, 'MEM-01015', 'Gizachew Tulu', 'M', '1980-12-01', '+251 91 222 3455', 'gizachew.tulu@gmail.com', 'FAY-1414141414', 'Nifas Silk-Lafto 09', 'Woreda 7', 'Addis Ababa', 'Civil Servant', 'Ministry of Finance', 'Active', '2023-03-15', 13200, 86000, 58000),
  (16, 'MEM-01016', 'Rahel Abebe', 'F', '1996-04-28', '+251 91 222 3456', 'rahel.abebe@gmail.com', 'FAY-1616161616', 'Kolfe Keranio 11', 'Woreda 8', 'Addis Ababa', 'Nurse', 'Ministry of Health', 'Active', '2023-04-15', 12000, 81000, 0),
  (17, 'MEM-01017', 'Mekdes Tadesse', 'F', '1991-11-13', '+251 91 222 3457', 'mekdes.tadesse@gmail.com', 'FAY-1818181818', 'Gulele 05', 'Woreda 4', 'Addis Ababa', 'Banker', 'Commercial Bank of Ethiopia', 'Active', '2024-01-15', 10800, 76000, 0),
  (18, 'MEM-01018', 'Robel Hailemariam', 'M', '1989-03-06', '+251 91 222 3458', 'robel.hailemariam@gmail.com', 'FAY-2020202020', 'Lideta 06', 'Woreda 5', 'Addis Ababa', 'Driver', 'Addis Ababa City Administration', 'Active', '2024-02-15', 9600, 72000, 0),
  (19, 'MEM-01019', 'Selam Teshome', 'F', '1987-07-21', '+251 91 222 3459', 'selam.teshome@gmail.com', 'FAY-2222222222', 'Akaki Kality 14', 'Woreda 12', 'Addis Ababa', 'Teacher', 'Ministry of Education', 'Active', '2025-03-15', 4800, 52000, 7000),
  (20, 'MEM-01020', 'Yared Bekele', 'M', '1993-09-16', '+251 91 222 3460', 'yared.bekele@gmail.com', 'FAY-2424242424', 'Addis Ketema 04', 'Woreda 3', 'Addis Ababa', 'IT Specialist', 'Ethio Telecom', 'Active', '2026-08-20', 1200, 8400, 0);

INSERT INTO next_of_kin (member_id, full_name, relation, phone) VALUES
  (1, 'Sara Abebe', 'Spouse', '+251 92 555 0101'),
  (2, 'Getahun Alemu', 'Spouse', '+251 92 555 0102'),
  (3, 'Marta Dawit', 'Spouse', '+251 92 555 0103'),
  (4, 'Tewodros Girma', 'Sibling', '+251 92 555 0104'),
  (5, 'Lensa Yonas', 'Spouse', '+251 92 555 0105'),
  (6, 'Dagmawi Haile', 'Spouse', '+251 92 555 0106'),
  (7, 'Hiwot Samuel', 'Spouse', '+251 92 555 0107'),
  (8, 'Biruk Frehiwot', 'Sibling', '+251 92 555 0108'),
  (9, 'Genet Natnael', 'Spouse', '+251 92 555 0109'),
  (10, 'Abel Liya', 'Spouse', '+251 92 555 0110');

INSERT INTO beneficiary (member_id, full_name, relation, phone, percent) VALUES
  (1, 'Sara Abebe', 'Spouse', '+251 92 555 0101', 60),
  (1, 'Amanuel Abebe', 'Child', '+251 92 555 0111', 40),
  (2, 'Getahun Alemu', 'Spouse', '+251 92 555 0102', 100),
  (3, 'Marta Dawit', 'Spouse', '+251 92 555 0103', 60),
  (3, 'Sofia Dawit', 'Child', '+251 92 555 0113', 40),
  (4, 'Tewodros Girma', 'Sibling', '+251 92 555 0104', 100),
  (5, 'Lensa Yonas', 'Spouse', '+251 92 555 0105', 100),
  (6, 'Dagmawi Haile', 'Spouse', '+251 92 555 0106', 100),
  (7, 'Hiwot Samuel', 'Spouse', '+251 92 555 0107', 100),
  (8, 'Biruk Frehiwot', 'Sibling', '+251 92 555 0108', 100),
  (9, 'Genet Natnael', 'Spouse', '+251 92 555 0109', 100),
  (10, 'Abel Liya', 'Spouse', '+251 92 555 0110', 100);

-- ============================================================
-- Savings transactions (§4) — sample of deposits
-- ============================================================
INSERT INTO savings_transaction (member_id, product_id, txn_date, txn_type, amount, teller, channel) VALUES
  (1, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (1, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (1, 2, '2026-08-18', 'Deposit', 5000, 'Rahel Abebe', 'Cash'),
  (2, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (2, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (2, 2, '2026-08-31', 'Interest', 240, 'System', 'Bank'),
  (3, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (3, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (4, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (4, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (4, 2, '2026-08-20', 'Withdrawal', 4500, 'Rahel Abebe', 'Cash'),
  (5, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (5, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (6, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (6, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (7, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (7, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (7, 2, '2026-08-18', 'Deposit', 8000, 'Rahel Abebe', 'Cash'),
  (8, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (8, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (9, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (9, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (9, 2, '2026-08-31', 'Interest', 180, 'System', 'Bank'),
  (10, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (10, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (15, 1, '2026-07-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (15, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off'),
  (20, 1, '2026-08-05', 'Deposit', 1200, 'Kaleab Desta', 'Check-Off');

-- ============================================================
-- Loans (§5) + guarantors
-- ============================================================
INSERT INTO loan (id, loan_no, member_id, product_id, loan_status, amount, disbursed_at, term_months, rate_pct, schedule_type, principal_paid, interest_paid, balance, overdue_days, classification, ai_score, ai_pd_pct, ai_guidance, next_due_date) VALUES
  (1, 'LN-2026-001', 1, 1, 'Disbursed', 180000, '2026-03-10', 24, 12.0, 'Reducing Balance', 46000, 16200, 134000, 0, 'Pass', 78, 4.2, 'Approve as applied', '2026-10-10'),
  (2, 'LN-2026-014', 4, 2, 'Partially Paid', 95000, '2025-09-20', 36, 10.5, 'Reducing Balance', 34000, 9800, 61000, 12, 'Special Mention', 55, 14.6, 'Reduce amount or add guarantor', '2026-10-20'),
  (3, 'LN-2026-027', 7, 3, 'Disbursed', 320000, '2026-01-15', 48, 11.0, 'Straight-Line', 50000, 28500, 270000, 0, 'Pass', 86, 2.1, 'Approve as applied', '2026-10-15'),
  (4, 'LN-2026-031', 9, 4, 'Under Appraisal', 60000, NULL, 12, 13.0, 'Flat Rate', 0, 0, 0, 0, 'Pass', 64, 9.8, 'Approve with reduced amount', NULL),
  (5, 'LN-2026-038', 12, 5, 'Disbursed', 600000, '2026-05-02', 48, 11.5, 'Reducing Balance', 62000, 29500, 538000, 0, 'Pass', 81, 3.4, 'Approve as applied', '2026-11-02'),
  (6, 'LN-2025-088', 15, 1, 'Partially Paid', 150000, '2025-02-12', 24, 12.0, 'Reducing Balance', 92000, 21000, 58000, 45, 'Substandard', 38, 27.5, 'Add collateral; consider restructuring', '2026-10-12'),
  (7, 'LN-2026-045', 17, 2, 'Pending', 120000, NULL, 36, 10.5, 'Reducing Balance', 0, 0, 0, 0, 'Pass', 72, 5.9, 'Approve as applied', NULL),
  (8, 'LN-2025-112', 19, 4, 'Partially Paid', 40000, '2025-08-25', 12, 13.0, 'Flat Rate', 33000, 5200, 7000, 90, 'Doubtful', 22, 41.0, 'Refer to recovery team', '2026-10-25'),
  (9, 'LN-2026-050', 20, 1, 'Approved', 85000, NULL, 24, 12.0, 'Reducing Balance', 0, 0, 0, 0, 'Pass', 88, 1.7, 'Approve as applied', NULL);

INSERT INTO guarantor (loan_id, member_id, name, exposure, pledged_deposit, guarantor_status) VALUES
  (1, 3, 'Dawit Tesfaye', 180000, 60000, 'Active'),
  (2, 5, 'Yonas Tadesse', 95000, 30000, 'Active'),
  (3, 2, 'Meseret Alemu', 320000, 100000, 'Active'),
  (5, 6, 'Selamawit Haile', 600000, 150000, 'Active'),
  (6, 8, 'Frehiwot Negash', 150000, 40000, 'Active'),
  (9, 2, 'Meseret Alemu', 85000, 50000, 'Active');

-- ============================================================
-- Journal entries (§6)
-- ============================================================
INSERT INTO journal_entry (jrn_date, ref_no, description, account_code, account_name, debit, credit, posted_by) VALUES
  ('2026-09-05', 'JRN-2026-0041', 'Monthly check-off collection - Ethiopian Airlines', '1000', 'Cash on Hand', 148000, 0, 'Marta Demissie'),
  ('2026-09-05', 'JRN-2026-0042', 'Monthly check-off collection - Ethiopian Airlines', '1200', 'Member Savings - Mandatory', 0, 148000, 'Marta Demissie'),
  ('2026-09-06', 'JRN-2026-0043', 'Loan disbursement LN-2026-050', '1400', 'Loan Portfolio - Outstanding', 85000, 0, 'Marta Demissie'),
  ('2026-09-06', 'JRN-2026-0044', 'Loan disbursement funding', '1000', 'Cash on Hand', 0, 85000, 'Marta Demissie'),
  ('2026-09-07', 'JRN-2026-0045', 'Interest accrual - September', '2000', 'Interest Income - Loans', 0, 24600, 'Marta Demissie'),
  ('2026-09-07', 'JRN-2026-0046', 'Interest accrual - September receivable', '1410', 'Interest Receivable', 24600, 0, 'Marta Demissie'),
  ('2026-09-07', 'JRN-2026-0049', 'Interest accrual on member savings - Q3', '3310', 'Interest Expense - Member Savings', 12400, 0, 'Marta Demissie'),
  ('2026-09-07', 'JRN-2026-0050', 'Interest accrual on member savings - Q3', '2200', 'Accrued Interest Payable', 0, 12400, 'Marta Demissie'),
  ('2026-09-08', 'JRN-2026-0047', 'Vault to bank transfer', '1100', 'Bank - CBE Current Account', 400000, 0, 'Marta Demissie'),
  ('2026-09-08', 'JRN-2026-0048', 'Vault to bank transfer', '1000', 'Cash on Hand', 0, 400000, 'Marta Demissie');

-- ============================================================
-- Check-off batches (§7)
-- ============================================================
INSERT INTO checkoff_batch (id, employer, batch_month, uploaded_at, row_count, matched, unmatched, expected, received, variance, batch_status) VALUES
  (1, 'Ethiopian Airlines', 'Aug 2026', '2026-09-05T10:00:00Z', 148, 145, 3, 148000, 146200, -1800, 'Variance'),
  (2, 'Commercial Bank of Ethiopia', 'Aug 2026', '2026-09-05T10:05:00Z', 95, 95, 0, 118000, 118000, 0, 'Reconciled'),
  (3, 'Ethio Telecom', 'Aug 2026', '2026-09-06T09:30:00Z', 62, 62, 0, 74000, 74000, 0, 'Reconciled'),
  (4, 'Addis Ababa University', 'Aug 2026', '2026-09-07T08:40:00Z', 41, 40, 1, 52000, 51000, -1000, 'Variance');

-- ============================================================
-- Collateral (§8)
-- ============================================================
INSERT INTO collateral (id, code, asset_type, owner_name, description, valuation, forced_sale_value, discount_pct, loan_id, loan_ref, insurance_expiry, coll_status) VALUES
  (1, 'COL-001', 'Property Title Deed', 'Abebe Bekele', 'Title deed - 2-bed house, Bole, 120 m2', 2400000, 1680000, 30, 1, 'LN-2026-001', '2027-03-10', 'Pledged'),
  (2, 'COL-002', 'Property Title Deed', 'Samuel Worku', 'Title deed - 3-bed house, Yeka, 180 m2', 3800000, 2660000, 30, 3, 'LN-2026-027', '2027-01-15', 'Pledged'),
  (3, 'COL-003', 'Vehicle Ownership', 'Tigist Fikre', 'Toyota Corolla 2022, Chassis TZ1234', 1450000, 1160000, 20, 5, 'LN-2026-038', '2027-05-02', 'Pledged'),
  (4, 'COL-004', 'Share Certificate', 'Meseret Alemu', 'Member share certificate - 2,400 shares', 240000, 192000, 20, 9, 'LN-2026-050', NULL, 'Pending Release'),
  (5, 'COL-005', 'Bank Guarantee', 'Hanna Girma', 'Third-party guarantee - Dashen Bank', 120000, 120000, 0, 2, 'LN-2026-014', '2026-12-31', 'Pledged');

-- ============================================================
-- Shares & dividends (§9)
-- ============================================================
INSERT INTO share_transfer (id, transfer_date, from_member, to_member, share_count, amount, transfer_status) VALUES
  (1, '2026-08-12', 'Gizachew Tulu', 'Selam Teshome', 1200, 120000, 'Approved'),
  (2, '2026-08-28', 'Elias Mulugeta', 'Robel Hailemariam', 800, 80000, 'Pending'),
  (3, '2026-09-02', 'Bethlehem Admassu', 'Mekdes Tadesse', 500, 50000, 'Pending');

INSERT INTO dividend_run (id, fin_year, total_surplus, statutory_reserve, distributable, eligible_members, dividend_per_share, total_distribution, dividend_status) VALUES
  (1, '2024', 5200000, 780000, 4420000, 1250, 8.5, 4410000, 'Credited'),
  (2, '2025', 5800000, 870000, 4930000, 1310, 9.0, 4920000, 'Credited'),
  (3, '2026', 0, 0, 0, 0, 0, 0, 'Proposed');

-- ============================================================
-- Cash & branch ops (§13)
-- ============================================================
INSERT INTO till (id, teller_name, opening, deposits, withdrawals, closing, expected, variance, till_status) VALUES
  (1, 'Kaleab Desta', 500000, 482000, 296000, 686000, 686000, 0, 'Open'),
  (2, 'Rahel Abebe', 400000, 310500, 245000, 465500, 465000, 500, 'Discrepancy');

INSERT INTO cash_movement (id, movement_date, from_location, to_location, amount, initiated_by, approved_by, movement_status, movement_type) VALUES
  (1, '2026-09-08', 'Vault', 'Kaleab Desta (Teller 1)', 200000, 'Kaleab Desta', 'Tigist Fikre', 'Approved', 'Vault to Teller'),
  (2, '2026-09-08', 'Kaleab Desta (Teller 1)', 'Vault', 86000, 'Kaleab Desta', NULL, 'Pending', 'Teller to Vault'),
  (3, '2026-09-07', 'Vault', 'CBE Main Branch', 400000, 'Marta Demissie', 'Tigist Fikre', 'Approved', 'Vault to Bank');

INSERT INTO petty_cash (id, entry_date, description, category, amount, receipt_no, pc_status) VALUES
  (1, '2026-09-04', 'Office stationery', 'Office Supplies', 1450, 'RC-8821', 'Open'),
  (2, '2026-09-06', 'Fuel for generator', 'Fuel', 3200, 'RC-8830', 'Open'),
  (3, '2026-09-07', 'Coffee and refreshments', 'Hospitality', 850, 'RC-8834', 'Reimbursed');

-- ============================================================
-- Approvals (maker-checker) & notifications (§10, §11)
-- ============================================================
INSERT INTO approval (id, approval_type, ref_no, summary, amount, initiated_by, requested_at, approval_status) VALUES
  (1, 'Loan Approval', 'LN-2026-050', 'Personal Loan - Yared Bekele', 85000, 'Biruk Kebede', '2026-09-06T10:15:00Z', 'Pending'),
  (2, 'Loan Disbursement', 'LN-2026-050', 'Treasury disbursement authorization', 85000, 'Biruk Kebede', '2026-09-07T09:30:00Z', 'Pending'),
  (3, 'Collateral Release', 'COL-004', 'Release share certificate - Meseret Alemu', 240000, 'Biruk Kebede', '2026-09-07T14:05:00Z', 'Pending'),
  (4, 'Large Withdrawal', 'WT-2026-118', 'Voluntary savings withdrawal - Hanna Girma', 45000, 'Rahel Abebe', '2026-09-08T08:50:00Z', 'Pending'),
  (5, 'Journal Adjustment', 'JRN-2026-0049', 'Correction - mis-posted fixed deposit interest', 12400, 'Marta Demissie', '2026-09-08T09:10:00Z', 'Pending'),
  (6, 'Cash Movement', 'CM-2026-023', 'Teller to Vault transfer - Kaleab Desta', 86000, 'Kaleab Desta', '2026-09-08T11:20:00Z', 'Pending');

INSERT INTO notification (member_id, member_name, channel, notif_type, message, sent_at) VALUES
  (1, 'Abebe Bekele', 'SMS', 'Deposit', 'Your mandatory savings deposit of ETB 1,200 has been received.', '2026-09-05T10:12:00Z'),
  (4, 'Hanna Girma', 'SMS', 'Loan Repayment', 'Your loan repayment of ETB 3,540 is due in 3 days (LN-2026-014).', '2026-09-05T09:00:00Z'),
  (7, 'Samuel Worku', 'SMS', 'Deposit', 'Your voluntary savings deposit of ETB 5,000 has been received.', '2026-09-06T13:40:00Z'),
  (9, 'Natnael Mekonnen', 'SMS', 'Loan Approval', 'Your loan application LN-2026-031 is under appraisal by the credit committee.', '2026-09-07T15:22:00Z'),
  (15, 'Gizachew Tulu', 'SMS', 'Overdue Alert', 'Your loan LN-2025-088 has an overdue balance of ETB 8,400. Please contact the branch.', '2026-09-08T08:00:00Z'),
  (20, 'Yared Bekele', 'SMS', 'Check-Off', 'Your salary deduction of ETB 2,900 was received from your employer.', '2026-09-05T11:05:00Z');

SELECT setval('member_id_seq', (SELECT MAX(id) FROM member));
SELECT setval('savings_product_id_seq', (SELECT MAX(id) FROM savings_product));
SELECT setval('loan_product_id_seq', (SELECT MAX(id) FROM loan_product));
SELECT setval('loan_id_seq', (SELECT MAX(id) FROM loan));
SELECT setval('gl_account_id_seq', (SELECT MAX(id) FROM gl_account));
SELECT setval('checkoff_batch_id_seq', (SELECT MAX(id) FROM checkoff_batch));
SELECT setval('collateral_id_seq', (SELECT MAX(id) FROM collateral));
SELECT setval('share_transfer_id_seq', (SELECT MAX(id) FROM share_transfer));
SELECT setval('dividend_run_id_seq', (SELECT MAX(id) FROM dividend_run));
SELECT setval('till_id_seq', (SELECT MAX(id) FROM till));
SELECT setval('cash_movement_id_seq', (SELECT MAX(id) FROM cash_movement));
SELECT setval('petty_cash_id_seq', (SELECT MAX(id) FROM petty_cash));
SELECT setval('approval_id_seq', (SELECT MAX(id) FROM approval));
SELECT setval('notification_id_seq', (SELECT MAX(id) FROM notification));
SELECT setval('journal_entry_id_seq', (SELECT MAX(id) FROM journal_entry));
SELECT setval('role_id_seq', (SELECT MAX(id) FROM role));
SELECT setval('savings_transaction_id_seq', (SELECT MAX(id) FROM savings_transaction));