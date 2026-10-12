-- ============================================================
-- V20: Document types master
-- ============================================================

CREATE TABLE document_type (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(60)  NOT NULL UNIQUE,
    name             VARCHAR(160) NOT NULL,
    category         VARCHAR(60)  NOT NULL DEFAULT 'Customer',
    mandatory        BOOLEAN      NOT NULL DEFAULT false,
    retention_years  INTEGER      NOT NULL DEFAULT 5,
    description      VARCHAR(300),
    doc_status       VARCHAR(20)  NOT NULL DEFAULT 'Pending'
);

INSERT INTO document_type (id, code, name, category, mandatory, retention_years, description, doc_status) VALUES
  (1, 'DOC-NID', 'National ID Copy', 'Customer', true, 10, 'Copy of the national identity card', 'Verified'),
  (2, 'DOC-PHOTO', 'Passport Photo', 'Customer', true, 5, 'Recent passport-size photograph', 'Verified'),
  (3, 'DOC-KYC', 'KYC Form', 'Customer', true, 10, 'Know-your-customer declaration', 'Verified'),
  (4, 'DOC-SIG', 'Signature Card', 'Customer', true, 10, 'Specimen signature card', 'Verified'),
  (5, 'DOC-PAYSLIP', 'Payslip / Employment Letter', 'Loan', false, 5, 'Proof of income', 'Verified'),
  (6, 'DOC-TITLE', 'Collateral Title Deed', 'Collateral', false, 15, 'Ownership document for collateral', 'Verified'),
  (7, 'DOC-INSURANCE', 'Insurance Certificate', 'Collateral', false, 5, 'Insurance covering pledged asset', 'Pending'),
  (8, 'DOC-GUARANTEE', 'Guarantee Agreement', 'Loan', false, 10, 'Loan guarantee contract', 'Verified'),
  (9, 'DOC-ACCT-OPEN', 'Account Opening Form', 'Account', true, 10, 'Signed account opening form', 'Verified');

SELECT setval(pg_get_serial_sequence('document_type', 'id'), (SELECT MAX(id) FROM document_type));
