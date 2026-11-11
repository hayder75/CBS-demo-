# 06 — Vendor and Third-Party Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-06 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | Operations Manager |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All vendors, suppliers, contractors and service providers that access, process, store or support Anchor Financials data or Anchor CBS.

## 1. Purpose

1.1 To ensure third parties meet Anchor Financials' security, privacy and continuity requirements before engagement and throughout the contract.

1.2 To manage the risks of data disclosure, service failure, concentration, subcontracting and insecure exit.

## 2. Scope and criticality

2.1 This policy covers the hosting provider, AfroMessage SMS gateway, software and support suppliers, backup and off-site storage providers, IT contractors, auditors and any provider receiving personal or financial data.

2.2 Vendors are classified as:

| Tier | Definition | Examples | Due diligence | Review |
|---|---|---|---|---|
| Critical | Processes or stores member/financial data, or outage would stop core operations. | Hosting provider, AfroMessage, database support. | Full assessment before contract and annually. | Annual plus event-driven |
| Important | Supports security, audit or operations but not directly member data. | Backup storage, monitoring, IT support. | Focused assessment. | Annual |
| Standard | Low data access and low operational impact. | Office supplies, general software. | Basic check and contract terms. | Every 2 years |

2.3 A vendor register is maintained by the Operations Manager with owner, service, tier, data accessed, contract dates, review date and exit plan.

## 3. Due diligence

3.1 Before engagement, the vendor completes a security questionnaire covering governance, access control, encryption, logging, incident response, backup, subcontractors, data location, personnel screening and previous breaches.

3.2 Anchor Financials reviews available assurance evidence, such as independent audit reports, penetration-test summaries or certifications. Certifications are considered as evidence but are not required or claimed by Anchor Financials.

3.3 Reference checks and financial stability checks are performed for Critical vendors.

3.4 The CISO/Security Officer assesses the residual risk and records it in the risk register under AF-POL-09. Critical vendors require CEO approval.

3.5 No production data is shared before a contract and data processing terms are signed.

## 4. Contract and SLA requirements

4.1 Contracts must include:

- scope, services, service levels and remedies;
- confidentiality and data protection obligations consistent with Proclamation No. 1321/2024;
- permitted data use, location and cross-border transfer conditions;
- security controls and minimum standards;
- incident notification within 24 hours of discovery, with cooperation;
- audit and information rights, including access to relevant reports;
- subcontractor approval and flow-down of obligations;
- return and secure deletion of data at exit;
- business continuity and recovery commitments;
- liability, insurance and termination rights for material breach;
- breach notification to regulators and affected persons where the vendor is at fault.

4.2 Critical service levels include availability of at least 99.5% per month, excluding approved maintenance, and recovery within the RTO in AF-POL-04.

4.3 Contracts are reviewed by Legal/Compliance before signature. Verbal commitments are not accepted.

## 5. Data processing

5.1 Vendors process only the data and purposes specified in the contract. They must not use Anchor Financials data for marketing, analytics, model training or their own purposes.

5.2 Personal data is minimized, masked where possible, encrypted in transit and at rest, and stored only in approved locations.

5.3 Vendors must maintain access logs, protect credentials, screen personnel and notify Anchor Financials of any change to subcontractors or data location.

5.4 Cross-border processing requires a documented risk assessment and CEO approval. Where required, standard contractual clauses or equivalent safeguards are used.

5.5 On termination, the vendor returns all data in an agreed format and deletes remaining copies within 30 days, providing written confirmation.

## 6. AfroMessage SMS provider

6.1 AfroMessage is used for OTP delivery and member notifications. It is a Critical vendor because OTP availability affects administrative access.

6.2 The API key is stored server-side only, never in the browser or source repository, and is rotated at least annually and on suspected exposure.

6.3 Only the minimum necessary data is sent: phone number, message content and message type. Passwords, full account details and identification numbers are never sent by SMS.

6.4 Message content is approved by the business owner. OTP messages contain no member or transaction details.

6.5 Delivery logs are retained for 12 months under AF-POL-05 and reviewed for failures, abuse and unusual volume.

6.6 The contract must include delivery SLAs, incident notification, data location, confidentiality and deletion terms. A fallback procedure applies under AF-POL-02 and AF-POL-04 if the gateway is unavailable.

## 7. Hosting provider

7.1 The hosting provider supplies physical security, power, cooling, network and virtualization for production systems. Anchor Financials remains accountable for application, database and access controls.

7.2 The provider must demonstrate physical access control, CCTV, visitor management, environmental monitoring, redundancy and secure media disposal consistent with AF-POL-12.

7.3 The provider must notify Anchor Financials of security incidents, access requests by authorities, subprocessor changes and material outages without undue delay.

7.4 Anchor Financials reviews the provider's assurance reports annually and records any gaps. Where assurance is insufficient, the CISO/Security Officer may require an on-site assessment or compensating controls.

7.5 Production data must be hosted in an approved location. Backup copies must be geographically separate as required by AF-POL-04.

## 8. Access restrictions

8.1 Vendor access is named, approved, time-bound and limited to the minimum required. Shared vendor accounts are prohibited.

8.2 Remote vendor access requires MFA, an approved secured device, and supervision or session logging.

8.3 Vendor access to production data requires a written request, CISO/Security Officer approval and a defined support window. Access is disabled when the task ends.

8.4 Vendors must not copy production data to their own systems without approval. Any approved copy is encrypted, minimized and deleted after use.

8.5 All vendor access is logged and included in the quarterly access review under AF-POL-02.

## 9. Monitoring and annual review

9.1 The Operations Manager monitors SLA performance, incidents, security notifications and contract obligations.

9.2 Critical vendors are reviewed annually against the due diligence criteria, with updated assurance evidence, incident history and risk rating.

9.3 Reviews are brought forward after a vendor breach, major outage, ownership change, subcontractor change or new regulatory requirement.

9.4 Review results and actions are reported to the CISO/Security Officer and included in management review.

## 10. Vendor incidents

10.1 Vendors must notify Anchor Financials within 24 hours of discovering an incident affecting Anchor Financials data or services, or sooner where the contract requires.

10.2 Anchor Financials treats a vendor incident as its own incident under AF-POL-03, assesses member and regulatory impact, and coordinates containment.

10.3 The vendor must provide an incident report, root cause, affected data, remediation and evidence of closure.

10.4 Repeated or material failures may lead to service credits, remediation plans, suspension or termination.

## 11. Exit and transition

11.1 Every Critical vendor has a documented exit plan covering data extraction, format, deletion, transition support, timelines and costs.

11.2 Exit is triggered by contract end, material breach, insolvency, unacceptable risk or business change.

11.3 Data is returned and verified before access is removed. Deletion certificates are obtained and retained for seven years.

11.4 Transition is treated as a change under AF-POL-10 and tested to avoid service disruption.

## 12. Review

12.1 This policy is reviewed annually and after a vendor incident or significant regulatory change.

## 13. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-04 (Continuity), AF-POL-05 (Retention), AF-POL-09 (Risk), AF-POL-10 (Change), AF-POL-12 (Physical).
