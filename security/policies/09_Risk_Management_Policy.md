# 09 — Risk Management Policy

| Document control | |
|---|---|
| **Policy ID** | AF-POL-09 |
| **Version** | 1.0 |
| **Effective date** | 11 November 2026 |
| **Owner** | CISO/Security Officer |
| **Approver** | CEO / Board |
| **Classification** | Internal |
| **Review date** | 11 November 2027 |

**Applies to:** All Anchor Financials functions, information assets, projects, vendors and changes affecting Anchor CBS.

## 1. Purpose

1.1 To establish a consistent method for identifying, assessing, treating, monitoring and reporting information security risks.

1.2 To connect security risk to business objectives, audit findings, INSA requirements and management decisions.

## 2. Scope

2.1 This policy covers risks to the confidentiality, integrity and availability of Anchor CBS, member and financial data, supporting infrastructure, people, vendors and regulatory compliance.

2.2 It applies to routine operations, projects, new systems, third-party arrangements, changes and incidents.

## 3. Risk methodology

3.1 Risk is assessed as **likelihood × impact** using a 5×5 matrix. Scores range from 1 to 25.

3.2 **Likelihood** is the probability of the event occurring within 12 months, considering existing controls.

| Score | Likelihood | Description |
|---|---|---|
| 1 | Rare | Exceptional circumstances; less than 5% chance. |
| 2 | Unlikely | Could occur but not expected; 5–20%. |
| 3 | Possible | Might occur at some time; 20–50%. |
| 4 | Likely | Will probably occur; 50–80%. |
| 5 | Almost certain | Expected to occur or already occurring; over 80%. |

3.3 **Impact** considers financial loss, member harm, service disruption, regulatory breach, legal liability and reputational damage.

| Score | Impact | Description |
|---|---|---|
| 1 | Insignificant | Minor inconvenience; no data or financial loss; contained internally. |
| 2 | Minor | Limited internal disruption; small recovery cost; no regulatory reporting. |
| 3 | Moderate | Service degradation; limited member impact; reportable internally; some regulatory attention. |
| 4 | Major | Significant outage or data exposure; financial loss; NBE/INSA notification likely; reputational harm. |
| 5 | Severe | Prolonged outage, widespread data breach, major fraud or regulatory action; threat to viability. |

3.4 **Risk score bands:**

| Score | Rating | Required action | Acceptance authority |
|---|---|---|---|
| 1–4 | Low | Accept and monitor; standard controls. | Risk owner |
| 5–9 | Medium | Treat within an agreed plan; monitor quarterly. | CISO/Security Officer |
| 10–15 | High | Treat with priority; CEO visibility; monthly monitoring. | CEO |
| 16–25 | Critical | Immediate action; restrict or stop activity; Board decision. | Board |

3.5 Inherent risk is assessed before additional controls. Residual risk is assessed after controls and is the basis for acceptance.

## 4. Risk appetite

4.1 Anchor Financials has a **low appetite** for risks affecting member funds, member data, audit integrity and regulatory compliance.

4.2 The organization tolerates low residual risk in routine operations and accepts medium residual risk only where treatment is impractical and compensating controls exist.

4.3 High residual risk requires CEO approval with a time-bound treatment plan. Critical residual risk is not accepted without Board approval and immediate containment.

4.4 Risks that could cause widespread data breach, undetected fraud, loss of audit integrity or prolonged core service outage are never accepted without Board sign-off.

## 5. Risk register

5.1 The CISO/Security Officer maintains a single risk register. Each entry contains:

| Field | Description |
|---|---|
| Risk ID | Unique identifier (for example R-001). |
| Asset / process | System, data, service or business process affected. |
| Risk description | Cause, event and consequence. |
| Threat / vulnerability | Relevant threat source and weakness. |
| Existing controls | Preventive, detective and corrective controls in place. |
| Likelihood / impact | Scores before additional treatment. |
| Inherent score | Likelihood × impact. |
| Treatment option | Mitigate, transfer, avoid or accept. |
| Treatment plan | Actions, owner and due date. |
| Residual likelihood / impact | Scores after treatment. |
| Residual score and rating | Basis for acceptance. |
| Risk owner | Named accountable manager. |
| Status | Open, in treatment, accepted, closed. |
| Review date | Next scheduled review. |
| Linkages | Related audit finding, INSA checklist row, incident or change. |

5.2 The register is stored in a restricted repository. Sensitive risk details are shared on a need-to-know basis.

5.3 Risks are not closed without evidence that treatment is complete or that acceptance is approved.

## 6. Risk treatment

6.1 **Mitigate.** Apply controls to reduce likelihood or impact. Most security risks are treated this way.

6.2 **Transfer.** Transfer financial or contractual risk through insurance, contracts or vendor obligations. Transfer does not remove accountability.

6.3 **Avoid.** Stop the activity or do not implement the system or feature.

6.4 **Accept.** Retain the risk with documented justification, owner, expiry and monitoring. Acceptance follows the authority table in section 3.4.

6.5 Treatment plans state actions, resources, owner, due date, success criteria and residual risk target. Overdue actions are escalated.

## 7. Ownership and responsibilities

| Role | Responsibility |
|---|---|
| Board | Sets risk appetite; approves critical risks; oversees the risk portfolio. |
| CEO | Accountable for risk management; approves high risks and treatment resources. |
| CISO/Security Officer | Maintains methodology and register; facilitates assessments; monitors treatment; reports to CEO and Board. |
| Risk owners | Identify, assess and treat risks in their area; update the register; provide evidence. |
| Operations Manager | Manages operational, continuity and vendor risks. |
| Internal Audit | Reviews risk process and treatment evidence independently; does not own risks. |
| All staff | Identify and report risks and control weaknesses. |

## 8. Assessment cadence

8.1 A full risk assessment is conducted annually and before major changes, new systems, new vendors or new regulatory obligations.

8.2 The risk register is reviewed quarterly by the management team. High and critical risks are reviewed monthly.

8.3 Event-driven reviews occur after an S1/S2 incident, a material audit finding, a significant outage, a data breach or a major change in law or NBE direction.

8.4 Project risk assessments are completed before go-live and recorded in the change request under AF-POL-10.

## 9. Linkage to audits and INSA

9.1 Audit findings from Internal Audit, external audit, NBE or INSA are entered in the risk register with an owner and due date.

9.2 Each risk may reference the relevant INSA OF/AEAD/001 checklist area and control, and the related vulnerability or audit finding.

9.3 Remediation evidence is retained and made available to auditors. Closure of an audit finding requires verification by Internal Audit or the CISO/Security Officer.

9.4 The risk register is a primary input to the annual management review and the security budget.

## 10. Reporting and metrics

10.1 The CISO/Security Officer reports quarterly on the risk profile, new and closed risks, overdue treatments, incidents and audit actions.

10.2 The annual report to the Board covers risk appetite, top risks, residual exposure, treatment progress and any accepted risks.

10.3 Metrics include number of high/critical risks, percentage of treatment actions on time, recurring risks and audit findings past due.

## 11. Review

11.1 This policy and the methodology are reviewed annually, and after major incidents or changes in the risk environment.

## 12. Related policies

AF-POL-01 (Information Security), AF-POL-02 (Access Control), AF-POL-03 (Incident Response), AF-POL-04 (Continuity), AF-POL-06 (Vendors), AF-POL-10 (Change), AF-POL-11 (Logging).
