# 11 — Logging and Monitoring Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-11 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** Anchor CBS application, API, database, servers, network components, authentication services and administrative activity.

## 1. Purpose

1.1 To generate, protect and review records that detect and investigate security events, support audit and regulatory requirements, and preserve accountability for financial and administrative actions.

1.2 To ensure the audit trail is complete, accurate, time-synchronized and tamper-evident.

## 2. Events to be logged

| Category | Events |
|---|---|
| Authentication | Successful and failed login, logout, lockout, unlock, password change/reset, MFA challenge, OTP success/failure/resend, token issuance and revocation. |
| Authorization | Access denied, role check failure, privilege escalation attempt, unauthorized API request. |
| User administration | Account creation, modification, disablement, role assignment, MFA reset, access review action. |
| Business activity | Member create/update, deposit, withdrawal, transfer, savings and share transaction, loan origination, approval/rejection, disbursement, repayment, write-off, journal posting. |
| Approvals | Maker-checker approval or rejection, override, limit exception. |
| Configuration | Product, branch, charge, interest, GL rule, notification template, system setting and security configuration changes. |
| Administrative actions | Backup, restore, scheduler run, cache clear, migration, deployment, service restart, database maintenance. |
| Audit integrity | Hash-chain verification result, verification failure, attempted update/delete on audit tables. |
| Errors and availability | Application errors, exceptions, failed jobs, health-check failures, disk/CPU/database alerts, TLS and certificate errors. |
| Network and infrastructure | nginx access/error logs, firewall denies, unusual outbound connections. |
| Vendor and remote access | VPN login, vendor support session start/end, break-glass use. |

2.1 Events relevant to financial transactions, approvals, access and administration must be recorded in the immutable audit trail. High-volume operational logs may be stored separately.

## 3. Log content

3.1 Each audit event records:

- unique event ID and timestamp in UTC;
- actor user ID, username, role and branch;
- action, entity type, entity ID and outcome;
- field changed, old value and new value (redacted where sensitive);
- source IP address and user agent;
- request or correlation ID;
- hash of the previous record and hash of the current record.

3.2 Logs must be sufficient to reconstruct who did what, when, from where and with what result.

3.3 Passwords, OTPs, JWT tokens, API keys, PINs and full sensitive identifiers must never be written to logs. Sensitive fields are redacted at capture.

3.4 Log timestamps use a single time standard (UTC). Local time may be displayed but the stored value is UTC.

## 4. Immutable audit trail

4.1 The Anchor CBS audit trail is append-only and protected by a SHA-256 hash chain. Each record includes the hash of the preceding record, so alteration or deletion breaks the chain.

4.2 Database triggers reject UPDATE and DELETE on the audit trail and SMS log tables. Application users, including ADMIN, have no interface to modify or delete audit records.

4.3 Audit-trail integrity is verified at least daily and before any audit export. A failed verification is an S1 or S2 incident under AF-POL-03, depending on scope.

4.4 Audit exports are accompanied by the verification result and a SHA-256 hash of the export file, recorded in the chain-of-custody log.

4.5 No one may disable, bypass or weaken audit logging. Any planned maintenance affecting logging requires CISO/Security Officer approval and compensating monitoring.

## 5. Time synchronization

5.1 All servers, network devices and database hosts synchronize time using authenticated NTP from approved sources.

5.2 NTP drift is monitored. A drift above 5 seconds triggers an alert and correction.

5.3 Timezone configuration is documented. Application logs and audit records store UTC; business reports may display East Africa Time (EAT).

5.4 If NTP is unavailable, the system continues on local clock and the Operations Manager is notified. The event is recorded and reviewed.

## 6. Retention

6.1 Audit trail records are retained for seven years under AF-POL-05.

6.2 Authentication and security event logs are retained for seven years where they form part of the audit trail.

6.3 Operational, application, nginx and debug logs are retained for 12 months, unless required for an incident, legal hold or audit.

6.4 SMS logs are retained for 12 months.

6.5 Logs subject to an investigation or legal hold are preserved beyond the standard period.

6.6 Retention is enforced by automated lifecycle rules. Deletion is logged and approved; audit records cannot be deleted before expiry.

## 7. Access to logs

7.1 Access to audit and security logs is restricted to:

| Role | Access |
|---|---|
| AUDITOR | Read-only, including export for audit purposes. |
| ADMIN | Read-only for defined operational purposes; cannot modify or delete. |
| MANAGER | Read-only for branch and approval activity within their authority. |
| CISO/Security Officer | Read, investigate, export and configure alerts. |
| System Administrator | Operational logs; audit-table access limited and logged. |

7.2 Shared log accounts are prohibited. All access to audit data is itself logged.

7.3 Logs are stored in a restricted repository with encryption at rest and access controls. Exports are encrypted and stored in the approved evidence location.

7.4 Audit logs are not copied to personal devices or unapproved cloud services.

## 8. Review and monitoring

| Review | Frequency | Owner |
|---|---|---|
| Automated alert triage | Continuous | System Administrator / CISO |
| Failed login and lockout review | Daily | System Administrator |
| Audit-trail integrity verification | Daily | System Administrator |
| Privileged and administrative action review | Monthly | CISO/Security Officer |
| Access review | Quarterly (privileged monthly) | CISO/Security Officer |
| Log configuration and retention check | Quarterly | CISO/Security Officer |
| Full log review for audit evidence | Before audit and annually | Internal Audit |

8.1 Reviews record the reviewer, date, sample or period, findings and actions. "No findings" is recorded explicitly.

8.2 Anomalies are raised as incidents under AF-POL-03.

## 9. Alerting

9.1 Automated alerts are configured for at least:

- five consecutive failed logins or repeated lockouts;
- failed MFA attempts or OTP abuse;
- login from a new country or unusual IP for privileged accounts;
- role or permission changes, especially ADMIN/MANAGER;
- after-hours administrative activity;
- audit-trail verification failure or attempted modification;
- backup or restore failure;
- database availability, disk capacity or certificate expiry;
- unusual transaction volume, large value transactions or repeated overrides;
- malware or endpoint protection alerts;
- configuration changes to logging, TLS, firewall or authentication.

9.2 Alerts are routed to a monitored mailbox or on-call channel. Critical alerts require acknowledgement within 15 minutes.

9.3 Alert rules are reviewed quarterly to reduce false positives and cover new threats.

9.4 Alert failures or gaps are treated as control failures and reported to the CISO/Security Officer.

## 10. Protection of logs

10.1 Log storage is segregated from general application data where practicable, with write-only collection and restricted read access.

10.2 Logs are encrypted in transit and at rest. Backups of logs follow AF-POL-04.

10.3 Administrative access to log infrastructure requires MFA and is logged.

10.4 Logs must not be sent to third parties except under AF-POL-06, a legal requirement or an approved audit.

10.5 Tampering with, disabling or deleting logs is a disciplinary matter and may be a criminal offence.

## 11. Privacy and personal data

11.1 Logs may contain personal data. Collection is limited to what is necessary for security and audit.

11.2 Access to logs is need-to-know and monitored. Log data is used only for security, audit, fraud prevention, dispute resolution and legal purposes.

11.3 Data subject requests are handled under AF-POL-05, subject to legal and audit retention requirements.

11.4 Log data is masked where full values are not required, particularly phone numbers and identification numbers.

## 12. Review

12.1 This policy is reviewed annually, and after a logging failure, audit finding, major incident or change to the audit architecture.

## 13. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-04 (Continuity), AF-POL-05 (Retention), AF-POL-06 (Vendors), AF-POL-09 (Risk), AF-POL-10 (Change).
