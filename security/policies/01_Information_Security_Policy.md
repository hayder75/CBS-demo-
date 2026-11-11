# 01 — Information Security Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-01 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All Anchor Financials employees, directors, contractors, interns, temporary staff and third parties who access Anchor CBS or Anchor Financials information.

## 1. Purpose

1.1 This policy defines Anchor Financials' information security objectives, governance, responsibilities and the rules by which the organization protects information. It is the top-level policy for the pack indexed in AF-POL-00.

1.2 It establishes management commitment to protect member information, financial records and the Anchor CBS platform, and to meet Ethiopian legal, NBE and INSA expectations.

## 2. Objectives

2.1 Protect the confidentiality of member, KYC, financial and personnel information.

2.2 Preserve the integrity and accuracy of transactions, ledger balances, reports and the audit trail.

2.3 Maintain availability of Anchor CBS within the recovery targets in AF-POL-04.

2.4 Detect, report and respond to security incidents in accordance with AF-POL-03.

2.5 Meet applicable legal, regulatory, contractual and audit obligations.

2.6 Build security awareness and accountability across all users.

2.7 Continuously improve controls through risk assessment, audit and management review.

## 3. Scope

3.1 This policy applies to all information assets used to deliver Anchor CBS, including:

- the web front end, Spring Boot API, PostgreSQL database, nginx proxy and Ubuntu hosts;
- JWT credentials, SMS OTP factors, API keys and encryption keys;
- member, KYC, savings, shares, loan, accounting, reporting and audit data;
- backups, exports, reports and supporting documents in any format;
- hosting, SMS and other third-party services;
- staff devices and remote connections used to access the platform.

3.2 The boundaries and exclusions in AF-POL-00 section 2 apply.

## 4. Security principles

4.1 **Confidentiality.** Information is accessible only to authorized users for authorized purposes. Access is granted on least privilege and need to know.

4.2 **Integrity.** Data and systems are protected from unauthorized or accidental modification. Financial transactions are subject to maker-checker controls, and audit records are append-only and hash-chained.

4.3 **Availability.** Systems and data are available to support SACCO operations and are recoverable within approved RTO/RPO targets.

4.4 **Accountability.** Every user has a unique identity. Privileged and financial actions are attributable and logged.

4.5 **Risk-based protection.** Controls are proportionate to the sensitivity of the asset and the assessed risk under AF-POL-09.

4.6 **Privacy by design.** Personal data is collected for defined purposes, minimized, protected and retained only as required by AF-POL-05.

4.7 **Defence in depth.** Access control, authentication, logging, backup, physical security and vendor controls operate together; no single control is relied upon alone.

4.8 **Continual improvement.** Incidents, audit findings and changes feed corrective action and policy review.

## 5. Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Board | Owns information security risk; approves this pack and the risk appetite; receives annual assurance; approves critical risk acceptances. |
| CEO | Accountable for implementation; allocates resources; approves high-risk exceptions; acts as escalation point for S1 incidents. |
| CISO/Security Officer | Maintains the policy pack; leads risk assessment and incident response; coordinates audits and access reviews; monitors compliance; reports to CEO and Board. |
| Operations Manager | Owns service availability, backup and restoration, change management, hosting and vendor operations. |
| System Administrator | Operates servers, database, accounts and backups; implements approved changes; preserves logs; does not approve own changes or financial transactions. |
| Department Heads | Ensure staff are trained and comply; approve access requests for their teams; report incidents promptly. |
| Internal Audit | Independently reviews controls and evidence; has read-only access to systems and logs; reports to the Board/Audit Committee. |
| All users | Comply with this pack; protect credentials and data; report suspected incidents; complete required training. |
| Third parties | Meet contractual security obligations under AF-POL-06 and report incidents without delay. |

## 6. Policy framework

6.1 The framework has three levels:

- **Level 1 — Policies:** this pack, approved by the CEO/Board.
- **Level 2 — Standards and procedures:** technical hardening baselines, operating procedures, incident playbooks, backup runbooks and access-review procedures.
- **Level 3 — Records:** logs, approvals, training records, test results, risk register entries and audit evidence.

6.2 The subordinate policies are AF-POL-02 to AF-POL-12. Each policy states its owner and review date. Supporting procedures must not weaken a policy requirement.

6.3 The CISO/Security Officer maintains a controlled index (AF-POL-00) and ensures only current versions are published.

## 7. Compliance with Ethiopian law and regulation

7.1 Anchor Financials complies with the Personal Data Protection Proclamation No. 1321/2024, the Computer Crime Proclamation No. 958/2016, applicable NBE directives, cooperative/SACCO law and INSA requirements.

7.2 The organization cooperates with INSA, NBE, law enforcement and competent authorities within legal limits. Regulatory notifications are made under AF-POL-03.

7.3 Financial and member records are retained and produced as required by AF-POL-05. Data is not transferred outside Ethiopia except with lawful basis, appropriate safeguards and management approval.

7.4 No certification is claimed by this policy. Audit evidence is maintained so that INSA and NBE can verify controls directly.

## 8. Exceptions

8.1 An exception is a documented, time-bound deviation from a policy requirement.

8.2 Requests must state the requirement, reason, scope, compensating controls, risk rating, owner and expiry date, and must be approved by the CISO/Security Officer.

8.3 Exceptions rated High or Critical also require CEO approval; Critical exceptions also require Board approval. Exceptions affecting audit, financial reporting or member data require consultation with Internal Audit and Compliance.

8.4 Exceptions are valid for no more than 12 months, are recorded in the exception register and are reviewed quarterly. Expired exceptions must be closed or re-approved.

8.5 A policy exception does not suspend legal or regulatory obligations.

## 9. Review and monitoring

9.1 The CISO/Security Officer monitors compliance through access reviews, log reviews, vulnerability management, incident trends, backup tests and audit findings.

9.2 This policy and the pack are reviewed annually by 11 November, and after a major incident, major change, new regulation or significant audit finding.

9.3 Management review considers risk status, incidents, audit results, training completion, exceptions and resource needs. Results are reported to the Board.

## 10. Disciplinary consequences

10.1 Violations may result in corrective action, withdrawal of access, formal warning, disciplinary proceedings up to termination, recovery of losses, or referral to law enforcement.

10.2 Consequences apply proportionately to employees, contractors and third parties, and are applied consistently with Human Resources policy and Ethiopian labour law.

10.3 Suspected fraud, data theft, sabotage or unauthorized access is referred immediately to the CEO and Internal Audit, and may be reported to police.

## 11. Related policies

AF-POL-00 (Index), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-05 (Data Retention), AF-POL-07 (Acceptable Use), AF-POL-08 (Training), AF-POL-09 (Risk), AF-POL-11 (Logging).
