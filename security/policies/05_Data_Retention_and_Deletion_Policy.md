# 05 — Data Retention and Deletion Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-05 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All Anchor Financials data in Anchor CBS, backups, exports, logs, documents and third-party services.

## 1. Purpose

1.1 To keep information only as long as required for business, legal, regulatory and audit purposes, and to delete it securely afterwards.

1.2 To protect personal data and to respond consistently to data subject requests and legal holds.

## 2. Principles

2.1 Data is collected for defined purposes, minimized, kept accurate and retained only under this schedule.

2.2 Retention periods run from the trigger event stated in the schedule, not from the date of last access.

2.3 Deletion is suspended when a legal hold, investigation, audit or dispute applies.

2.4 Retention applies equally to production data, exports, backups, archives and third-party copies under Anchor Financials' control.

2.5 Audit records are immutable and may not be deleted or altered before their retention period expires.

## 3. Retention schedule

| Data category | Examples | Retention period | Trigger | Owner |
|---|---|---|---|---|
| Member and KYC records | Member profile, identification, Fayda ID, contact details, guarantors, next of kin, membership documents | 5 years after membership exit | Membership exit date | Operations Manager |
| Financial and transaction records | Savings, shares, deposits, withdrawals, loan disbursements, repayments, GL journals, reconciliations, statements | 7 years | End of the financial year in which the record was created or the account closed | Accountant / Operations Manager |
| Loan records | Applications, appraisals, collateral, guarantees, approvals, schedules, write-offs, recoveries | 7 years after final settlement or write-off | Settlement or write-off date | Credit Manager |
| Audit trail | Authentication, access, create/update/delete, approvals, configuration and administrative actions | 7 years | Date of the audit event | CISO/Security Officer |
| SMS and OTP logs | Delivery status, recipient number, message type, gateway response | 12 months | Date sent | Operations Manager |
| Backup copies | Database, configuration and release backups | 90 days rolling | Backup date | Operations Manager |
| Incident records | Incident reports, evidence, notifications, post-incident reviews | 7 years | Incident closure | CISO/Security Officer |
| Change records | Change requests, approvals, test evidence, deployment and post-implementation reviews | 7 years | Change closure | Operations Manager |
| BCP, DR and backup test records | Backup logs, restore tests, BCP/DR exercises | 7 years | Test or backup date | Operations Manager |
| Risk management records | Risk register entries, assessments, treatment evidence, acceptances | 7 years | Risk closure | CISO/Security Officer |
| Asset disposal records | Disposal logs and certificates of destruction | 7 years | Disposal date | Operations Manager |
| Physical access and visitor records | Visitor logs, access card and key records | 2 years | Date of visit or record | Operations Manager |
| CCTV recordings | Entrance, exit and secure-area footage | 30 days | Recording date | Operations Manager |
| Security and access reviews | Access review results, exception register, risk acceptances | 7 years | Date of review or closure | CISO/Security Officer |
| Training and acknowledgement records | Completion records, phishing results, policy acknowledgements | 5 years | End of employment or record date | Human Resources |
| Vendor contracts and due diligence | Contracts, SLAs, assessments, exit plans | 7 years after contract end | Contract end date | Operations Manager |
| Operational and application logs | Debug, performance, proxy and deployment logs (not audit trail) | 12 months | Log date | System Administrator |
| Regulatory reports and correspondence | NBE/INSA returns, audit correspondence, statutory reports | 7 years | Date of report | Compliance / CEO |

3.1 Where two periods apply, the longer period applies.

3.2 Records subject to an active legal hold are retained until the hold is released in writing, even if the schedule period has expired.

## 4. Legal holds

4.1 A legal hold may be issued by the CEO, Legal/Compliance or Internal Audit for litigation, investigation, regulatory request, audit or dispute.

4.2 The hold notice identifies the matter, custodians, data categories, systems and start date. It is sent to the CISO/Security Officer and Operations Manager.

4.3 On receipt, automated deletion and purge jobs are suspended for the affected data. Backups containing the data are preserved beyond 90 days.

4.4 The hold is recorded in a legal-hold register. It is released only by written notice, after which normal retention resumes and deletion occurs at the next cycle.

4.5 Staff must not delete, alter or remove data subject to a hold. Doing so is a disciplinary matter and may be a criminal offence.

## 5. Secure deletion

5.1 Electronic records are deleted using approved methods: database deletion with verification, cryptographic erasure of encrypted volumes, or secure wipe consistent with NIST SP 800-88.

5.2 Paper records are cross-cut shredded or destroyed by an approved destruction vendor, with a certificate of destruction.

5.3 Deletion is performed by an authorized administrator, verified by a second person for financial, member or audit data, and recorded in a deletion log (date, category, volume, method, approver). Audit records are exported and hash-verified before any approved purge.

5.4 Backups expire automatically at 90 days through the backup lifecycle. Individual records are not selectively edited out of backups; expiry and key destruction handle backup copies.

5.5 Decommissioned disks, servers, laptops and mobile devices are sanitized before disposal or reuse. Certificates of destruction are retained for seven years.

5.6 Deletion must not destroy records needed for an audit, investigation or legal hold.

## 6. Masking and redaction

6.1 Personal and sensitive fields are masked by default in screens, reports and exports where full values are not required. This includes phone numbers, Fayda ID, email addresses and account numbers.

6.2 Audit logs and SMS logs must not store passwords, OTPs, JWT tokens, API keys or full identification numbers. Sensitive fields are redacted at capture.

6.3 Unmasking requires a role permission and business justification. Unmasking actions are logged.

6.4 Test and development environments use synthetic or masked data. Production data is not copied to developer machines.

6.5 Exports containing personal data are approved by the data owner, encrypted, shared through an approved channel and deleted when no longer needed.

## 7. Data subject requests

7.1 Requests for access, correction, deletion, restriction or objection are logged and routed to the CISO/Security Officer and Legal/Compliance.

7.2 Identity is verified before any data is disclosed or changed. Requests from third parties require lawful authority.

7.3 Requests are answered within 30 days or the period required by the Personal Data Protection Proclamation No. 1321/2024, whichever is shorter. Extensions are documented.

7.4 Deletion requests are assessed against retention obligations. Where retention is required by NBE, tax, audit or legal hold, the request is refused in part with reasons, and the data is deleted when the obligation ends.

7.5 Requests, decisions and responses are retained for seven years as evidence of compliance.

## 8. Storage locations

| Data | Primary location | Copies / archive | Protection |
|---|---|---|---|
| Production database | Encrypted PostgreSQL at the contracted hosting provider | Encrypted daily backups off-site | TLS in transit, access control, audit logging |
| Audit trail | Production PostgreSQL, append-only hash-chained table | Encrypted backup and audit exports | Restricted read access, integrity verification |
| Backups | Primary backup storage and geographically separate off-site location | 90-day rolling | AES-256 encryption, separate key custody |
| SMS logs | Production database and AfroMessage gateway | Gateway records per vendor contract | Masked numbers in UI, 12-month retention |
| Paper records | Locked registry at Anchor Financials offices | Off-site archive if approved | Access log, clean-desk rules |
| Exports and reports | Restricted shared repository | Encrypted removable media only with approval | Named access, deletion after purpose |

8.1 Data must not be stored on personal devices, personal email, unapproved cloud services or removable media. See AF-POL-07.

8.2 Cross-border storage or transfer requires a lawful basis, a data processing agreement, a risk assessment and CEO approval.

## 9. Roles and monitoring

9.1 The CISO/Security Officer owns this policy and the retention schedule. Data owners are accountable for their categories.

9.2 The Operations Manager operates backup expiry and storage lifecycle. The System Administrator runs approved purge jobs and reports results.

9.3 Purge jobs run monthly. Results, exceptions and holds are reported quarterly to the CISO/Security Officer and annually to the Board.

## 10. Review

10.1 This policy is reviewed annually, and when laws, NBE directives or audit requirements change.

10.2 Retention periods may be extended but not shortened without CEO approval, legal advice and an updated risk assessment.

## 11. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-04 (Backup), AF-POL-06 (Vendors), AF-POL-07 (Acceptable Use), AF-POL-11 (Logging).
