-- ============================================================
-- V19: Product types
-- ============================================================

CREATE TABLE product_type (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(60)  NOT NULL UNIQUE,
    name            VARCHAR(120) NOT NULL,
    category        VARCHAR(40)  NOT NULL DEFAULT 'Saving',
    description     VARCHAR(300),
    product_status  VARCHAR(20)  NOT NULL DEFAULT 'Pending'
);

INSERT INTO product_type (id, code, name, category, description, product_status) VALUES
  (1, 'SAV-MAND', 'Mandatory Savings', 'Saving', 'Compulsory member savings', 'Verified'),
  (2, 'SAV-VOL', 'Voluntary Savings', 'Saving', 'Optional member savings', 'Verified'),
  (3, 'SAV-FIX', 'Fixed / Time Deposit', 'Saving', 'Fixed-term deposit product', 'Verified'),
  (4, 'SHR-ORD', 'Ordinary Shares', 'Share', 'Standard member share', 'Verified'),
  (5, 'SHR-SPEC', 'Special Shares', 'Share', 'Founder / special share class', 'Pending'),
  (6, 'LN-PER', 'Personal Loan', 'Loan', 'Individual personal loan', 'Verified'),
  (7, 'LN-GRP', 'Group Loan', 'Loan', 'Group-guaranteed loan', 'Verified'),
  (8, 'LN-BIZ', 'Business Loan', 'Loan', 'SME / business loan', 'Verified'),
  (9, 'LN-EMG', 'Emergency Loan', 'Loan', 'Short-term emergency loan', 'Verified'),
  (10, 'LN-EDU', 'Education Loan', 'Loan', 'School fees loan', 'Pending');

SELECT setval(pg_get_serial_sequence('product_type', 'id'), (SELECT MAX(id) FROM product_type));
