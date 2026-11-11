# Anchor Financials — Information Security Policy Pack

**System:** Anchor CBS — Web-Based SACCO Core Banking / ERP Platform
**Organization:** Anchor Financials

| Document control | |
|---|---|
| **Policy ID** | AF-POL-00 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | Management |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

## 1. Purpose

1.1 This policy pack sets out how Anchor Financials protects the confidentiality, integrity and availability of information held and processed in Anchor CBS, and how staff, contractors and third parties must use and protect that information.

1.2 The pack is the organization's own management system for information security. It is written to be adopted, signed and operated by Anchor Financials. Anchor Financials does **not** claim ISO/IEC 27001 certification or any other certification; ISO/IEC 27001 is used only as a reference structure while the organization builds its controls.

1.3 The pack supports preparation for an INSA cybersecurity audit against the INSA Cybersecurity Audit Minimum Requirements (OF/AEAD/001). It does not itself constitute an audit opinion or certification.

## 2. Scope

2.1 The pack covers the Anchor CBS web application, REST API, PostgreSQL database, nginx reverse proxy, Ubuntu host, JWT authentication, SMS OTP multi-factor authentication, role-based access control and the immutable hash-chained audit trail.

2.2 It also covers the people, processes, facilities and third parties that support those components, including the hosting provider and the AfroMessage SMS gateway.

2.3 The following are out of scope: POS terminals, electronic invoice machines, fiscal printers, card readers, ATM/switch integration, customer mobile or internet banking channels, and device firmware. Where such systems are introduced, this pack must be extended before deployment.

2.4 Physical and environmental controls operated by the hosting provider are covered by AF-POL-12 and AF-POL-06. Anchor Financials remains accountable for verifying that those controls are effective.

## 3. Policy framework and authority

3.1 The Board owns information security risk and approves this pack. The CEO is accountable for implementation. The CISO/Security Officer maintains the pack and reports on its performance.

3.2 This pack sits above supporting standards, procedures, checklists and records. Where a policy conflicts with a procedure, the policy prevails until the conflict is resolved by the CISO/Security Officer.

3.3 The pack is aligned with:

- The Personal Data Protection Proclamation No. 1321/2024 and applicable data protection directives;
- The Computer Crime Proclamation No. 958/2016;
- Applicable National Bank of Ethiopia (NBE) directives on microfinance/SACCO supervision, reporting, AML/CFT and cyber resilience;
- Applicable federal and regional cooperative and SACCO laws;
- INSA Cybersecurity Audit Minimum Requirements (OF/AEAD/001);
- ISO/IEC 27001 as a non-certified reference model.

3.4 The policy set is reviewed together, at least annually, so that cross-references and control expectations remain consistent.

## 4. Policy register

| ID | Policy | Purpose | Owner | Review |
|---|---|---|---|---|
| AF-POL-01 | Information Security Policy | Establishes security objectives, governance, roles, compliance and exceptions. | CISO/Security Officer | Annually |
| AF-POL-02 | Access Control and Authentication Policy | Controls least privilege, RBAC, passwords, MFA, sessions, provisioning and access reviews. | CISO/Security Officer | Annually |
| AF-POL-03 | Incident Response Plan | Defines severity, response lifecycle, notification, evidence and post-incident review. | CISO/Security Officer | Annually |
| AF-POL-04 | Business Continuity and Backup Policy | Sets RTO/RPO, backup, restore testing and disaster recovery arrangements. | Operations Manager | Annually |
| AF-POL-05 | Data Retention and Deletion Policy | Sets retention periods, legal holds, secure deletion, masking and data subject requests. | CISO/Security Officer | Annually |
| AF-POL-06 | Vendor and Third-Party Policy | Controls due diligence, contracts, access, monitoring and exit for suppliers. | Operations Manager | Annually |
| AF-POL-07 | Acceptable Use Policy | Defines authorized use of systems, devices, email, internet and data. | CISO/Security Officer | Annually |
| AF-POL-08 | Security Awareness and Training Policy | Sets onboarding, annual, phishing, secure coding and privileged-user training. | CISO/Security Officer | Annually |
| AF-POL-09 | Risk Management Policy | Defines risk method, register, appetite, treatment, ownership and review. | CISO/Security Officer | Annually |
| AF-POL-10 | Change Management Policy | Controls change types, approval, testing, rollback, database migration and review. | Operations Manager | Annually |
| AF-POL-11 | Logging and Monitoring Policy | Sets logged events, immutable audit trail, NTP, retention, review and alerting. | CISO/Security Officer | Annually |
| AF-POL-12 | Physical and Environmental Security Policy | Covers hosting facilities, access, visitors, CCTV, power, disposal and devices. | Operations Manager | Annually |

## 5. Adoption and sign-off

5.1 By signing below, the approvers adopt this pack with effect from 11 November 2026 and authorize management to enforce it.

5.2 Staff and contractors acknowledge the pack through the onboarding process and at each annual refresh. Acknowledgement records are retained by Human Resources.

| Name | Title | Signature | Date |
|---|---|---|---|
| [Name] | Chief Executive Officer (CEO) | | |
| [Name] | CISO / Security Officer | | |
| [Name] | Operations Manager | | |
| [Name] | Head of Internal Audit | | |

## 6. Distribution, exceptions and review

6.1 The pack is classified Internal. It is published to all staff on the organization's document repository, with a controlled copy held by the CISO/Security Officer.

6.2 Exceptions are requested and approved under AF-POL-01 section 8. No policy exception is valid without a recorded risk acceptance and expiry date.

6.3 The pack is reviewed annually by 11 November, and earlier after a major incident, a material change to Anchor CBS, a new regulatory requirement or an audit finding that affects policy content.

6.4 The CISO/Security Officer reports annually to the Board on policy compliance, open exceptions, risk treatment and audit findings.

## 7. Document history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 11 November 2026 | CISO/Security Officer | Initial policy pack adopted. |
