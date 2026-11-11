# 04 — Business Continuity and Backup Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-04 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | Operations Manager |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** Anchor CBS production services, PostgreSQL database, supporting infrastructure, backups and the staff responsible for continuity.

## 1. Purpose

1.1 To ensure that Anchor Financials can continue critical SACCO operations and recover Anchor CBS within agreed timeframes after disruption.

1.2 To protect the confidentiality, integrity and availability of backups and to prove restore capability through testing.

## 2. Scope

2.1 This policy covers the web front end, Spring Boot API, PostgreSQL database, nginx proxy, Ubuntu hosts, configuration, secrets needed for recovery, and backup media at primary and off-site locations.

2.2 It applies to outages caused by hosting failure, hardware or database corruption, ransomware, power or network loss, human error, vendor failure and loss of key staff.

2.3 Incident classification, notification and evidence handling are governed by AF-POL-03.

## 3. Recovery objectives

| Service / data | RTO | RPO | Notes |
|---|---|---|---|
| Core transaction processing (deposits, withdrawals, savings, shares, loan repayment) | 4 hours | 15 minutes | Continuous WAL archiving supports point-in-time recovery. |
| Member, KYC and loan records | 4 hours | 24 hours | Daily full backup plus WAL. |
| Authentication and access control | 4 hours | 24 hours | Restore with application and database. |
| Audit trail | 4 hours | 0 | Append-only, hash-chained; restore and verify chain. |
| SMS OTP and notifications | 24 hours | 24 hours | Break-glass access under AF-POL-02 if AfroMessage is unavailable. |
| Management and regulatory reports | 8 hours | 24 hours | Can be regenerated from restored data. |

3.1 RTO is the maximum acceptable time to restore service. RPO is the maximum acceptable data loss measured in time.

3.2 These targets are the organization's approved baseline pending a formal high-availability design. Any change requires CEO approval and a corresponding update to AF-POL-09.

## 4. Backup requirements

4.1 **Daily full backup.** A full encrypted backup of the PostgreSQL database and required application configuration is taken daily outside peak hours.

4.2 **Transaction logs.** PostgreSQL write-ahead logs (WAL) are archived continuously, with a target transfer interval of no more than 15 minutes, to support point-in-time recovery.

4.3 **Configuration and code.** Infrastructure configuration, nginx configuration, deployment scripts, secrets references and application release artefacts are backed up with each release and at least weekly.

4.4 **Encryption.** Backups are encrypted at rest with AES-256 and in transit with TLS 1.3. Encryption keys are stored separately from the backups in an approved key store or sealed safe, with access limited to the Operations Manager and one designated administrator.

4.5 **Integrity.** Backup jobs produce a checksum and completion status. Failed or incomplete backups trigger an alert and are re-run the same day.

4.6 **Access.** Backup access requires two-person authorization for restore of production data. Restores are logged.

4.7 **3-2-1 rule.** At least three copies exist (production, primary backup, off-site), on two different media or systems, with one copy off-site and geographically separated from the primary site.

4.8 **Retention.** Backup copies are retained for 90 days on a rolling basis, subject to legal hold under AF-POL-05. Backup media are never used as the system of record.

4.9 **Cloud and hosting.** Where the hosting provider performs infrastructure snapshots, those snapshots supplement but do not replace Anchor Financials' own verified database backups.

## 5. Off-site storage

5.1 Off-site backups are stored at a location or cloud region separate from the production hosting site, with access restricted to named administrators.

5.2 Off-site media are encrypted, labelled, transported by an approved courier or secure transfer, and recorded in a backup log.

5.3 Restoration from off-site media must be possible without the production site.

5.4 The organization verifies annually that the off-site provider's physical and access controls meet AF-POL-12.

## 6. Restore and testing

6.1 A sample restore is performed quarterly. At least one restore per year must be a full restore into an isolated environment and must include audit-trail verification.

6.2 Each test records the backup used, start and completion time, data integrity checks, audit-chain result, issues found and responsible person.

6.3 Restore tests must demonstrate achievement of the RTO/RPO targets in section 3, or a documented remediation plan must be raised.

6.4 Failed tests are treated as an incident under AF-POL-03 where they indicate an inability to recover.

6.5 Test restores use masked or non-production data where practicable. If production data is used, the test environment is access-controlled and deleted after the test.

## 7. Disaster scenarios and response

| Scenario | Response |
|---|---|
| Hosting provider outage | Activate the alternate region or rebuild from infrastructure configuration; notify staff and members; restore latest verified backup. |
| Database corruption | Stop writes, isolate the database, restore to the last known good point in time, reconcile transactions, verify audit chain. |
| Ransomware | Isolate affected systems, preserve evidence, do not pay, restore from offline backups, rebuild before reconnecting. |
| Power, network or cooling failure | Switch to provider redundancy or alternate site; monitor UPS/generator status. |
| SMS gateway outage | Use break-glass authentication under AF-POL-02 and alternate notification channels. |
| Loss of key staff | Use documented runbooks and cross-trained deputies; escalate to the Operations Manager. |
| Fraud or destructive insider action | Disable access, preserve evidence, restore affected records, involve Internal Audit and police. |

7.1 The Incident Commander under AF-POL-03 directs the response. The Operations Manager owns technical recovery.

7.2 Manual fallback: if Anchor CBS is unavailable, branches record transactions on approved sequentially numbered manual vouchers with dual signatures. Vouchers are entered and reconciled once service is restored, and retained under AF-POL-05.

## 8. Responsibility matrix

| Activity | Operations Manager | System Administrator | CISO/Security Officer | CEO |
|---|---|---|---|---|
| Approve backup schedule and retention | A | R | C | I |
| Run daily backups and monitor alerts | I | R | C | I |
| Manage encryption keys | A | R | C | I |
| Perform quarterly restore tests | A | R | C | I |
| Declare disaster and activate BCP | R | C | C | A |
| Communicate with regulators | C | I | C | A |
| Annual BCP test and report | R | C | C | A |

**A** = accountable, **R** = responsible, **C** = consulted, **I** = informed.

## 9. Business continuity arrangements

9.1 Critical processes are prioritized: member deposits and withdrawals, loan repayments, savings and shares, authentication, audit logging and regulatory reporting.

9.2 An alternate processing arrangement (secondary hosting region or rebuild capability) is documented and reviewed annually. It must not depend on the same single point of failure as production.

9.3 Key runbooks are available offline to the Operations Manager, System Administrator and Incident Commander.

9.4 Staff cross-training ensures at least two people can perform backup, restore and basic recovery.

9.5 Member and public communications templates are maintained by the Communications Lead under AF-POL-03.

## 10. Annual BCP test

10.1 A full BCP/DR test is conducted annually, involving business, technical and management representatives.

10.2 The test covers activation, roles, communications, restoration, manual fallback, reconciliation and return to normal service.

10.3 A test report is produced within 15 business days, including achieved RTO/RPO, gaps and corrective actions with owners and dates.

10.4 Results are reported to the CEO and Board. The policy and plans are updated based on the results.

## 11. Records and review

11.1 Backup logs, restore test reports, BCP test reports and key-management records are retained for seven years.

11.2 This policy is reviewed annually and after a major outage, disaster, restore failure or significant change to the platform.

## 12. Related policies

AF-POL-01 (Information Security), AF-POL-03 (Incident Response), AF-POL-05 (Retention), AF-POL-06 (Vendors), AF-POL-10 (Change Management), AF-POL-12 (Physical).
