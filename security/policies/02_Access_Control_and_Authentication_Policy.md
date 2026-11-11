# 02 — Access Control and Authentication Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-02 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All users, administrators, contractors and third parties with an Anchor CBS account or privileged access.

## 1. Purpose

1.1 To ensure that access to Anchor CBS and its supporting infrastructure is authorized, unique, role-appropriate and reviewed, and that authentication resists compromise.

1.2 To enforce least privilege and segregation of duties over financial and administrative functions.

## 2. Principles

2.1 Access is granted on least privilege and need to know, for a defined business purpose and period.

2.2 Every user has a unique account. Shared, generic or group accounts are prohibited, except documented service accounts owned by a named administrator.

2.3 Access rights follow the role, not the person. Role changes require a new request and approval.

2.4 Privileged access is limited, logged, reviewed more frequently and never used for routine business transactions.

2.5 Authentication uses at least a password; ADMIN and MANAGER accounts also require SMS OTP MFA.

## 3. Role-based access control

3.1 Anchor CBS uses six roles. Permissions are assigned to roles and roles to users; direct per-user permission grants are prohibited except through an approved exception.

| Role | Permitted functions | Prohibited functions |
|---|---|---|
| ADMIN | User and role administration, system configuration, branches, products, backups, health checks, audit verification. | Posting or approving financial transactions, approving loans or write-offs, altering audit records. |
| MANAGER | Branch oversight, approvals within delegated limits, reports, review of teller and credit activity. | User/role administration, system configuration, altering audit records. |
| TELLER | Member servicing, deposits, withdrawals, savings and share transactions, receipts, day-end cash reconciliation. | Loan approval, write-offs, GL configuration, user administration, compliance policy changes. |
| CREDIT_OFFICER | Loan origination, appraisal, scoring, document capture, collection follow-up. | Loan disbursement or final approval, posting to GL, user administration. |
| ACCOUNTANT | General ledger, journals, reconciliations, financial reports, product accounting. | User administration, loan approval, altering audit records. |
| AUDITOR | Read-only access to transactions, reports, configurations and audit logs. | Any create, update, delete, approval or posting action. |

3.2 ADMIN accounts must not be used for business transactions. Where an administrator also performs a business role, a separate business account is issued.

3.3 The API enforces role permissions server-side. Front-end hiding of menus is not a control.

## 4. Segregation of duties

4.1 The following duties must be separated and performed by different users:

| Activity | Originator | Approver / Checker |
|---|---|---|
| Loan origination and appraisal | CREDIT_OFFICER | MANAGER or delegated loan committee |
| Loan disbursement | CREDIT_OFFICER / TELLER | MANAGER |
| Write-off, restructuring, waiver | CREDIT_OFFICER | MANAGER and, above limit, CEO/Board |
| Journal entry | ACCOUNTANT | MANAGER or second ACCOUNTANT |
| User creation and role change | System Administrator | CISO/Security Officer or MANAGER |
| Production deployment | Developer | System Administrator / Operations Manager |
| Backup and restore | System Administrator | Operations Manager (verification) |

4.2 A user must never approve their own transaction, change or access request. Maker-checker applies to all financial approvals.

4.3 Where staffing does not allow full separation, compensating controls (dual review, exception reporting, audit sampling) must be approved by the CISO/Security Officer and recorded as a risk under AF-POL-09.

## 5. Account provisioning and deprovisioning

5.1 **Request.** The line manager submits an access request stating the user, role, branch, business justification and end date (for temporary access).

5.2 **Approval.** The department head approves; the CISO/Security Officer approves privileged and ADMIN/MANAGER roles.

5.3 **Creation.** The System Administrator creates a unique account, assigns only the approved role and records the request ID. The user signs the acceptable-use acknowledgement (AF-POL-07).

5.4 **Credentials.** Initial passwords are delivered through a secure channel and must be changed at first login. Passwords and OTPs are never sent to personal email or stored in plaintext.

5.5 **Changes.** Role or branch changes require a new approved request. Old access is removed at the same time new access is granted.

5.6 **Termination.** Access is disabled immediately on notification of dismissal, resignation or abandonment, and before the person leaves the premises. Line managers must notify IT at least one business day before a planned departure.

5.7 **Contractors and third parties.** Accounts are named, time-bound, sponsored by an Anchor Financials manager and disabled at contract end. Vendor support access is supervised and logged.

5.8 **Dormancy.** Accounts unused for 60 days are disabled; ADMIN and MANAGER accounts unused for 30 days are disabled. Re-enablement requires approval.

5.9 **Leavers.** The System Administrator records the disablement date, returns or transfers data, and confirms removal in the leaver checklist.

## 6. Password policy

6.1 Passwords must be at least 12 characters and may be up to 64 characters.

6.2 Passwords must contain at least three of: uppercase letters, lowercase letters, numbers and symbols. They must not contain the username, the person's name, "Anchor", "CBS", or common dictionary patterns.

6.3 The last five passwords may not be reused.

6.4 Standard passwords are rotated every 180 days; ADMIN, MANAGER and service-account passwords every 90 days. Passwords are changed immediately on suspected compromise or after a privileged account is recovered.

6.5 Passwords are stored using bcrypt hashing. Plaintext or reversible storage is prohibited.

6.6 Users must not share passwords, write them on paper, store them in spreadsheets or send them by email or SMS. An approved password manager may be used for privileged credentials.

6.7 Service accounts use randomly generated passwords of at least 32 characters, are documented with an owner and purpose, and are rotated at least annually and on staff change.

6.8 Five consecutive failed logins lock the account for 15 minutes. Repeated lockouts are reviewed by the CISO/Security Officer as a possible attack.

## 7. Multi-factor authentication

7.1 SMS OTP MFA is mandatory for all ADMIN and MANAGER accounts. It is required for remote administrative access and for privileged actions designated by the CISO/Security Officer.

7.2 OTPs are six digits, valid for five minutes, limited to five verification attempts and subject to resend throttling. OTP values are never logged or displayed to support staff.

7.3 The enrolled phone number must be verified in person or by an approved identity check before activation. Changes to the MFA number require identity verification and CISO/Security Officer approval.

7.4 If the SMS gateway is unavailable, a break-glass procedure applies: the CISO/Security Officer authorizes access, an alternate verification channel is used, the session is logged, and the credential is rotated afterwards.

7.5 Lost devices, SIM changes and suspected OTP interception are treated as incidents under AF-POL-03.

7.6 MFA is not a substitute for least privilege. It is an additional layer.

## 8. Session management

8.1 Sessions time out after 30 minutes of inactivity. JWT access tokens have a maximum lifetime of 30 minutes.

8.2 Users must log out when leaving a workstation. Screens lock automatically after 10 minutes.

8.3 Sensitive actions (user/role changes, approval above limit, backup restore, configuration change) require re-authentication.

8.4 An ADMIN may have only one active administrative session. Concurrent sessions from unusual locations are blocked or reviewed.

8.5 Sessions are invalidated on logout, password change, role change, account disablement and suspected compromise.

## 9. Privileged access

9.1 Privileged access includes ADMIN accounts, database superuser or migration accounts, server root/sudo, backup administration and access to secrets.

9.2 Privileged accounts are named, not shared. Generic root logins are disabled; administrators use named accounts with sudo.

9.3 Direct database access is limited to approved maintenance. The runtime application uses a least-privilege database account; migrations use a separate account.

9.4 Privileged activity is logged and reviewed monthly by the CISO/Security Officer. Audit records of privileged actions are retained under AF-POL-11.

9.5 Break-glass credentials, if used, are stored sealed in an approved safe or password manager, access is recorded, and the credential is rotated after each use.

## 10. Remote access

10.1 Remote access to production is permitted only through an approved VPN or secure gateway with MFA.

10.2 Remote administrative access requires a managed or approved secured device with full-disk encryption, endpoint protection and current patches.

10.3 Public or shared computers, internet cafés and personal devices without approval may not be used to access production.

10.4 Remote sessions are logged. Split tunnelling and personal cloud storage are prohibited.

## 11. Access reviews

11.1 The CISO/Security Officer conducts a full access review quarterly. Privileged and ADMIN/MANAGER accounts are reviewed monthly.

11.2 Reviews compare the actual account list and role assignments with approved requests and current HR status.

11.3 Department heads confirm that each user still requires access. Unconfirmed or excessive access is removed within five business days.

11.4 Review results, removals and approvals are recorded and retained for seven years as audit evidence.

11.5 Access is also reviewed after a reorganization, merger, major system change or security incident.

## 12. Logging of access changes

12.1 All account creation, modification, disablement, role changes, password resets, MFA resets and failed login attempts are written to the audit trail.

12.2 Access logs record the actor, target user, change made, source IP, timestamp (UTC) and outcome.

12.3 Audit trail records are append-only and hash-chained. No user, including ADMIN, may edit or delete them.

## 13. Exceptions and review

13.1 Exceptions follow AF-POL-01 section 8 and are recorded with compensating controls.

13.2 This policy is reviewed annually, and after any material change to roles, authentication or the audit trail.

## 14. Related policies

AF-POL-01 (Information Security), AF-POL-03 (Incident Response), AF-POL-06 (Vendors), AF-POL-07 (Acceptable Use), AF-POL-08 (Training), AF-POL-10 (Change Management), AF-POL-11 (Logging).
