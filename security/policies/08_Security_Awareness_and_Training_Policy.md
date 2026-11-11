# 08 — Security Awareness and Training Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-08 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All employees, directors, contractors, interns, temporary staff and relevant third-party users.

## 1. Purpose

1.1 To equip staff with the knowledge and skills to recognize threats, handle member and financial data safely, and follow Anchor Financials policies.

1.2 To build a security-aware culture that supports Anchor CBS operations and INSA/NBE expectations.

## 2. Objectives

2.1 Ensure every user understands their security responsibilities before receiving access.

2.2 Reduce incidents caused by phishing, weak credentials, unsafe data handling and social engineering.

2.3 Ensure developers and administrators have role-specific secure engineering and operational skills.

2.4 Provide evidence of training completion for audit and management review.

## 3. Training requirements

| Audience | Training | Timing | Refresher |
|---|---|---|---|
| All new users | Security induction: policies, acceptable use, passwords/MFA, phishing, data handling, incident reporting, clean desk | Before account activation | Annual |
| All staff | Annual security awareness | Within 12 months of last training | Annual |
| All staff | Phishing awareness and simulated phishing | At induction | Quarterly simulations; annual formal module |
| TELLER, CREDIT_OFFICER, ACCOUNTANT | Fraud, maker-checker, member verification, transaction security | Before role access | Annual |
| MANAGER | Approval controls, incident escalation, access review duties | Before role access | Annual |
| ADMIN and System Administrators | Privileged access, secure configuration, logging, backup, incident response | Before privileged access | Every 6 months |
| Developers and engineers | Secure coding, OWASP Top 10, input validation, secrets management, secure SDLC, database migration safety | Before production access | Annual and on major technology change |
| Incident responders | Incident response plan, evidence handling, communications, BCP activation | Before joining the team | Annual exercise |
| Contractors and vendors | Confidentiality, acceptable use, incident reporting, access rules | Before access | Annual or at contract renewal |
| Board and senior management | Cyber risk, governance, regulatory obligations, incident oversight | On appointment | Annual briefing |

3.1 Training content is updated after significant incidents, audit findings, new threats, regulatory changes or major system changes.

3.2 Training is delivered in a language and format accessible to staff, including Ethiopian working languages where needed.

## 4. Onboarding

4.1 Human Resources notifies the CISO/Security Officer of new starters before their start date.

4.2 The new user completes security induction, signs the acceptable-use acknowledgement (AF-POL-07) and confirms understanding before the System Administrator activates the account.

4.3 Role-specific training is completed within 30 days of role assignment. Privileged users must complete privileged training before receiving elevated access.

4.4 Line managers are responsible for ensuring their staff attend and complete training.

## 5. Phishing awareness

5.1 Simulated phishing exercises are conducted at least quarterly. Results are used to target additional training, not to punish individuals.

5.2 Users must report suspicious messages using the approved reporting channel. Reporting rates and click rates are tracked as awareness metrics.

5.3 Users who repeatedly fail simulations receive one-to-one coaching. Repeated failure may lead to restricted access pending completion.

5.4 Real phishing campaigns affecting the organization are communicated promptly with clear guidance.

## 6. Secure coding and technical training

6.1 Developers must understand secure coding for Java/Spring Boot, JavaScript front ends and PostgreSQL, including authentication, authorization, input validation, output encoding, SQL injection prevention, file upload safety and secrets management.

6.2 Developers must not introduce code that weakens authentication, audit logging, role checks or encryption without approved change and security review under AF-POL-10.

6.3 Developers receive training on the immutable audit trail and the importance of not logging passwords, OTPs, tokens or unnecessary personal data.

6.4 Technical staff receive annual updates on vulnerabilities affecting the stack (Ubuntu, nginx, Spring Boot, PostgreSQL, Java, Node.js) and on secure configuration.

6.5 Training completion is required before a developer receives production repository or deployment rights.

## 7. Privileged user training

7.1 ADMIN, database administrators and System Administrators complete training on privileged access, least privilege, break-glass procedures, log integrity, backup security and incident escalation.

7.2 Privileged users are briefed on the prohibition on using administrative access for financial transactions or to alter audit records.

7.3 Refresher training is required every six months and after any privileged-access incident.

## 8. Awareness communications

8.1 The CISO/Security Officer issues awareness communications at least monthly, covering current threats, policy reminders, incident lessons and safe practices.

8.2 Awareness content is displayed in staff areas, intranet and onboarding materials.

8.3 Staff are encouraged to report concerns and near misses without blame.

8.4 Awareness metrics are reported to management quarterly and to the Board annually.

## 9. Tracking and records

9.1 Attendance, completion, assessment scores and acknowledgements are recorded in the training register.

9.2 Completion is tracked by department and role. The organization targets at least 90% completion for mandatory annual training.

9.3 Non-completion is escalated to the line manager, then Human Resources. Persistent non-completion may result in suspension of access.

9.4 Training records are retained for five years under AF-POL-05 and are available to Internal Audit and INSA on request.

9.5 The CISO/Security Officer reports training status, phishing results and gaps to the CEO and Board annually.

## 10. Consequences

10.1 Failure to complete mandatory training may result in withdrawal of access or disciplinary action under AF-POL-01 and AF-POL-07.

10.2 Deliberate violations demonstrated during training or awareness exercises are handled under the disciplinary process, not treated as training issues.

## 11. Review

11.1 This policy and the training plan are reviewed annually, and after major incidents, audit findings or technology changes.

## 12. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-07 (Acceptable Use), AF-POL-09 (Risk), AF-POL-10 (Change), AF-POL-11 (Logging).
