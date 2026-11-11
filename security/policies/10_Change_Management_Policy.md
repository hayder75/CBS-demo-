# 10 — Change Management Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-10 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | Operations Manager |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All changes to Anchor CBS production systems, code, configuration, database, infrastructure, security controls and integrations.

## 1. Purpose

1.1 To control changes so that they are authorized, tested, secure, traceable and reversible, and do not disrupt SACCO operations or compromise data.

1.2 To prevent unauthorized or untested modifications to production, including direct database changes.

## 2. Scope

2.1 This policy covers:

- application code, APIs, UI and dependencies;
- database schema, data migrations, reference data and configuration;
- nginx, TLS, DNS, firewall and server configuration;
- Ubuntu, Java, PostgreSQL and other infrastructure components;
- user roles, permissions and security settings;
- integrations with AfroMessage, hosting and monitoring services;
- emergency fixes and vendor-supplied updates.

2.2 Changes to business data made through approved application functions are transaction operations, not change requests, but remain subject to maker-checker under AF-POL-02.

## 3. Change types

| Type | Definition | Approval | Lead time | Records |
|---|---|---|---|---|
| **Standard** | Low-risk, repeatable change following a pre-approved procedure (for example routine certificate renewal, adding a branch, approved dependency patch). | Pre-approved by Operations Manager; executed by System Administrator. | Per procedure | Change log entry |
| **Normal** | Any change not classified as standard or emergency. Includes features, schema changes, access model changes and infrastructure updates. | Change Advisory Board (CAB): Operations Manager, CISO/Security Officer and business owner. | At least 5 business days before deployment | Full change record |
| **Emergency** | Urgent fix for a security incident, critical defect or service outage. | Incident Commander or Operations Manager; CISO consulted for security changes. | Immediate, retrospective approval | Emergency record within 24 hours |

3.1 The change owner proposes the type. The Operations Manager confirms it. Disputed classifications are treated as Normal.

3.2 A change that affects authentication, authorization, audit logging, encryption, personal data or external exposure always requires security review, even if small.

## 4. Change request and approval

4.1 Every Normal change has a request containing:

- title, description, business justification and affected services;
- change type, risk rating and rollback plan;
- implementation steps, schedule and responsible persons;
- testing and UAT evidence;
- security impact assessment;
- database migration details, if any;
- communication and support arrangements.

4.2 The CAB reviews risk, testing, timing, dependencies and rollback. Approval is recorded with names and dates.

4.3 Changes are not deployed without approval. The System Administrator must verify the approval reference before deployment.

4.4 High-risk changes require CEO approval. Changes affecting member data, financial reporting or regulatory obligations also require Compliance review.

4.5 The change calendar is maintained by the Operations Manager. Changes are scheduled outside peak SACCO hours, month-end, payroll and regulatory reporting periods unless justified.

## 5. Testing and UAT

5.1 Changes are tested in a development environment and then in a staging environment that reflects production configuration.

5.2 Testing covers functional behavior, negative cases, role permissions, input validation, error handling and audit logging.

5.3 Security testing is performed for changes affecting authentication, access control, data handling, external interfaces or dependencies. This includes authorization checks for each affected role and verification that sensitive data is not logged.

5.4 User acceptance testing is performed by the business owner or nominated users. UAT sign-off is recorded before production deployment.

5.5 Database migrations are tested on a recent copy of production data (masked where practicable) and timed to confirm the maintenance window.

5.6 Failed tests block deployment. Exceptions require CISO/Security Officer and business owner approval with compensating controls.

## 6. Segregation of duties

6.1 Developers must not approve or deploy their own changes to production.

6.2 Code is peer-reviewed before merge. At least one reviewer other than the author approves.

6.3 The System Administrator or Operations Manager deploys to production. Where a developer must deploy, a second person reviews and approves the deployment, and the event is logged.

6.4 Production database changes are executed by the System Administrator or a designated database administrator, not by application developers.

6.5 Access to production secrets and deployment credentials is restricted and logged.

## 7. Security review

7.1 Security review is required when a change:

- modifies login, MFA, passwords, sessions, roles or permissions;
- modifies audit logging, log retention or log access;
- introduces or changes encryption, key management or certificate handling;
- processes new personal or financial data, or changes data sharing;
- adds an external interface, vendor, API or data export;
- changes infrastructure, network exposure or backup configuration;
- introduces a major dependency or framework upgrade.

7.2 The review checks least privilege, input validation, secure defaults, error handling, logging, data protection and rollback safety.

7.3 Findings are recorded and resolved before deployment, or accepted by the CISO/Security Officer with a risk entry under AF-POL-09.

## 8. Deployment and rollback

8.1 A rollback plan is mandatory for Normal and Emergency changes. It states triggers, steps, responsible person, data implications and estimated time.

8.2 A backup is taken before any database migration or high-risk change. The restore path is verified.

8.3 Deployment follows the approved steps. Outputs and timestamps are recorded in the change record.

8.4 Post-deployment checks confirm service health, authentication, key transactions, audit logging and error rates.

8.5 If checks fail, the rollback plan is executed. Rollback decisions are recorded and treated as an incident if service or data is affected.

8.6 Changes are not left partially applied. Database migrations use versioned, forward-only scripts; a corrective migration is prepared where rollback is unsafe.

## 9. Database migration control

9.1 Schema changes are applied through the approved migration tool (Flyway) using versioned scripts under source control. Manual production DDL is prohibited except in an approved emergency, and must be captured as a migration afterward.

9.2 Migration scripts are peer-reviewed for correctness, locking, performance, data loss and rollback impact.

9.3 Destructive changes (dropping columns or tables, rewriting data) require explicit approval, a backup, and a documented data-retention assessment under AF-POL-05.

9.4 The runtime application database account has only the privileges required for operation. Migration credentials are separate and restricted.

9.5 Migration results and any exceptions are recorded in the change record.

## 10. Emergency changes

10.1 Emergency changes may be approved verbally by the Incident Commander or Operations Manager when delay would worsen an incident.

10.2 The change is logged immediately with the reason, scope, approver and time. A full record and retrospective approval are completed within 24 hours.

10.3 A post-implementation review is completed within 5 business days. Repeated emergency changes are analyzed for root cause.

10.4 Emergency changes still require testing where practicable and a rollback plan. Security-critical changes require CISO involvement.

## 11. Post-implementation review

11.1 A post-implementation review is completed within 5 business days for Normal changes and all Emergency changes, and for any change that caused an incident.

11.2 The review confirms objectives met, no unintended impact, monitoring results, user feedback, rollback status and lessons learned.

11.3 Corrective actions are assigned and tracked. Significant issues are added to the risk register.

## 12. Records and review

12.1 Change records, approvals, test evidence, UAT sign-off, deployment logs and post-implementation reviews are retained for seven years.

12.2 The Operations Manager reports monthly on change volume, emergency changes, failures, rollbacks and overdue actions.

12.3 This policy is reviewed annually and after a major change failure or audit finding.

## 13. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-04 (Continuity), AF-POL-09 (Risk), AF-POL-11 (Logging).
