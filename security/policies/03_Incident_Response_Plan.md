# 03 — Incident Response Plan

| Document control | |
|---|---|
| **Policy ID** | AF-POL-03 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All staff, contractors and third parties who detect, report or respond to a security incident affecting Anchor CBS.

## 1. Purpose

1.1 To provide a consistent, timely and documented response to security incidents so that harm to members, Anchor Financials and the Anchor CBS platform is contained and regulatory obligations are met.

1.2 To preserve evidence and support learning through post-incident review.

## 2. Scope and definitions

2.1 An **event** is an observed occurrence. An **incident** is an event that actually or potentially compromises confidentiality, integrity or availability, or breaches policy or law.

2.2 Incidents include unauthorized access, credential compromise, malware/ransomware, data breach, fraud, denial of service, audit-trail tampering, lost devices, vendor breaches and significant control failures.

2.3 This plan covers Anchor CBS and supporting infrastructure. It is activated alongside AF-POL-04 when availability is affected.

## 3. Severity classification

| Severity | Definition and examples | Initial response | Containment target | Escalation |
|---|---|---|---|---|
| **S1 — Critical** | Confirmed breach of member/financial data; ransomware; core CBS unavailable over 2 hours; fraud above ETB [threshold]; audit trail compromised; privileged account takeover with evidence of misuse. | Acknowledge within 15 minutes. | 4 hours | CEO within 1 hour; Board within 4 hours; NBE/INSA/legal as required. |
| **S2 — High** | Targeted intrusion contained before data access; MFA bypass; ADMIN compromise without confirmed misuse; outage 1–2 hours; fraud below threshold; multiple member accounts affected. | Acknowledge within 30 minutes. | 8 hours | CEO within 4 hours; regulators if reportable. |
| **S3 — Medium** | Single account compromise; contained malware; policy violation; degraded service; suspected data exposure limited to staff. | Acknowledge within 4 hours. | 24 hours | Operations Manager and CISO same day. |
| **S4 — Low / near miss** | Phishing email reported and not clicked; failed intrusion attempt; minor misconfiguration without data impact; lost unencrypted non-sensitive item. | Acknowledge within 1 business day. | 5 business days | CISO; trend reporting monthly. |

3.1 Severity may be raised as facts emerge. Only the Incident Commander or CEO may lower a severity, and the reason is recorded.

3.2 Suspected fraud is assessed jointly with Internal Audit and Compliance. Suspected crime is referred to police under AF-POL-01 and legal advice.

## 4. Roles

| Role | Responsibility |
|---|---|
| Incident Commander (CISO/Security Officer) | Declares severity, directs response, approves containment actions, owns the incident record and communications. |
| Deputy Incident Commander | Acts if the Commander is unavailable; usually the Operations Manager. |
| Technical Lead (System Administrator) | Investigates, contains, eradicates and recovers systems; preserves logs. |
| Communications Lead | Prepares internal and external statements; coordinates with CEO/legal. |
| Legal and Compliance Lead | Assesses legal, NBE and data protection duties; manages regulator and law enforcement contact. |
| Human Resources | Supports staff-related incidents and disciplinary process. |
| Business Representative | Represents affected SACCO operations and approves service restoration priorities. |
| Internal Audit | Observes, preserves independence, and may review evidence; does not direct operations. |
| All staff | Report suspected incidents immediately; do not attempt independent investigation or conceal mistakes. |

## 5. Detection and reporting

5.1 Incidents may be detected through audit-trail alerts, monitoring, failed-login and MFA alerts, backup failures, user reports, member complaints, vendor notifications, NBE/INSA contact or audit findings.

5.2 Any person who suspects an incident must report it immediately to the CISO/Security Officer at [Phone] / [Email], or to the service desk at [Phone] / [Email]. If unavailable, report to the Operations Manager at [Phone] / [Email].

5.3 Reports must state what was observed, when, which systems or members may be affected, and any action already taken. Staff must not delete evidence or test the incident themselves.

5.4 A report is logged with a unique incident ID, even if later found to be a false alarm.

## 6. Response lifecycle

6.1 **Preparation.** Maintain contact lists, playbooks, forensic tools, backup access and training. Test the plan annually under AF-POL-04.

6.2 **Identification.** Validate the report, determine scope and affected data, assign severity and open the incident record.

6.3 **Containment.** Apply short-term controls: disable accounts, revoke tokens, block IPs, isolate hosts, change credentials, restrict access, or take affected services offline. Preserve evidence before rebuilding.

6.4 **Eradication.** Remove malware, close the vulnerability or misconfiguration, patch, and confirm that the attacker no longer has access.

6.5 **Recovery.** Restore from verified backups or rebuild, validate data integrity and audit-trail continuity, monitor closely, and obtain business approval before returning to service.

6.6 **Closure.** Confirm that actions are complete, notifications made, evidence stored and the incident record approved by the Incident Commander.

## 7. Notification

7.1 The Incident Commander, with the CEO and Legal/Compliance, decides on notifications. No external statement is made without CEO approval unless law requires immediate disclosure.

| Recipient | When | Owner | Target |
|---|---|---|---|
| CEO and Board | S1 immediately; S2 within 4 hours; S3 in the daily report. | Incident Commander | As per severity table |
| NBE | Material operational, financial or cyber incidents, or as required by NBE directives. | CEO / Compliance | Within 24 hours of confirmation, or earlier if directed |
| INSA | Cyber incidents and crimes within INSA reporting expectations; support audit follow-up. | CISO/Security Officer | Within 24 hours of confirmation, or as advised |
| Police | Suspected fraud, theft, unauthorized access or sabotage. | CEO / Legal | Promptly after legal advice |
| Affected members | Where there is a high risk to their rights or financial interests. | CEO / Communications | Without undue delay, in clear language |
| Data protection authority | Personal data breach requiring notification under Proclamation No. 1321/2024. | Legal / CISO | Within the statutory period; where none is fixed, within 72 hours of confirmation |
| Vendors and insurers | Where their systems, cover or obligations are affected. | Operations Manager | Within contractual notice period |

7.2 Notifications must be accurate, documented and approved. The incident record notes who was notified, when, by what channel and what was said.

7.3 If the SMS gateway is unavailable, notification uses phone trees and secure email; this is tested annually.

## 8. Evidence preservation

8.1 Evidence includes audit-trail records, application and system logs, database records, network logs, configuration, memory or disk images, SMS gateway logs, emails and screenshots.

8.2 Preserve evidence before containment actions that could destroy it. Do not power off a compromised host unless instructed by the Incident Commander or forensic adviser.

8.3 Export audit-trail evidence with hash verification. Record the SHA-256 hash, collector, time, source and storage location.

8.4 Maintain a chain-of-custody log for every item. Store evidence in a restricted, encrypted location with access limited to the Incident Commander and Internal Audit.

8.5 Evidence is retained for seven years under AF-POL-05, or longer under legal hold.

## 9. Post-incident review

9.1 A post-incident review is held within 5 business days for S1/S2 and 10 business days for S3. S4 incidents are reviewed monthly in aggregate.

9.2 The review establishes root cause, timeline, impact, effectiveness of response, control gaps and corrective actions with owners and due dates.

9.3 The report is approved by the Incident Commander and shared with the CEO and Internal Audit. Lessons learned are incorporated into training, risk register and policy updates.

9.4 Corrective actions are tracked to closure. Internal Audit may verify completion.

## 10. Contacts

| Role | Name | Phone | Email | Alternate |
|---|---|---|---|---|
| Incident Commander (CISO/Security Officer) | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| CEO | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| Operations Manager | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| System Administrator | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| Legal / Compliance | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| Internal Audit | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| Hosting provider support | [Contact] | [Phone] | [Email] | [Contact] / [Phone] |
| AfroMessage support | [Contact] | [Phone] | [Email] | [Contact] / [Phone] |
| NBE contact | [Name] | [Phone] | [Email] | [Name] / [Phone] |
| INSA contact | [Name] | [Phone] | [Email] | [Name] / [Phone] |

10.1 The contact list is verified quarterly and after staff changes. It is available offline to the Incident Commander and Deputy.

## 11. Testing and review

11.1 A tabletop exercise is conducted annually and after major organizational change. It tests severity assignment, escalation, notification and evidence handling.

11.2 The plan is reviewed annually and after every S1/S2 incident or relevant audit finding.

## 12. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-04 (Business Continuity), AF-POL-05 (Retention), AF-POL-06 (Vendors), AF-POL-11 (Logging).
