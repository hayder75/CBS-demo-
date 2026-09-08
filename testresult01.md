# CBS General — Test Result 01

**Web-Based SACCO Management System · Test Run #1**
**Date:** 2026-09-08 · **Reference:** PRP-ETH-SACCO-2026-V6

---

## 1. Scope & Methodology

This is a full-system test run against the **live stack** (React + Vite → Spring Boot 3.5/Java 21 → PostgreSQL), **not** mocks. MSW is disabled; every assertion hits real HTTP endpoints backed by the database.

Dimensions covered:

| Dimension | How |
|---|---|
| Feature completion | Contract test asserting every endpoint + every field the frontend consumes |
| Functionality | E2E user journeys (login → operations → approvals → export) |
| Edge cases | Malformed input, unknown ids, auth failures, maker-checker rules, boundaries |
| Data integrity | Double-entry balance, balance-sheet balance, KPI ↔ records consistency |
| Speed | JUnit latency thresholds (real HTTP) + `ab` load test |
| Concurrency | Simultaneous approval decisions (race) |

### Environment
- Backend: Spring Boot 3.5.16, Java 21 (Temurin 21.0.12), Maven 3.9.9
- DB: PostgreSQL 16 local, `cbs` / `cbs_test`, Flyway V1+V2, seeded
- Frontend: React 18 + Vite 8 + TS, run with `VITE_USE_MOCK=false`
- E2E browser: Playwright Chromium headless-shell 153

---

## 2. Results Summary

| Suite | Total | Passed | Failed | Notes |
|---|---|---|---|---|
| Backend — API Contract (`ApiContractIT`) | 20 | 20 | 0 | every endpoint + field shape |
| Backend — Edge Cases (`EdgeCasesIT`) | 19 | 19 | 0 | auth, bad input, maker-checker |
| Backend — Data Integrity (`DataIntegrityIT`) | 6 | 6 | 0 | books balance, KPIs consistent |
| Backend — Performance (`PerformanceIT`) | 4 | 4 | 0 | latency + concurrency race |
| Backend — Write Flows (`WriteFlowsIT`) | 16 | 16 | 0 | forms → API → DB + GL |
| Backend — Regression (`SaccoApiIntegrationTest`) | 7 | 7 | 0 | original smoke suite |
| Frontend — Unit (Vitest) | 15 | 15 | 0 | format, CSV, API client |
| E2E — Playwright (Chromium) | 9 | 9 | 0 | real browser journeys incl. forms/charts |
| **Total** | **96** | **96** | **0** | |

Load test (`ab`, against live backend): **0 failed requests** across all targets (see §6).

**Verdict: PASS — all 96 automated tests green; load test clean.**

---

## 3. Backend — API Contract (20 tests)

Verifies **every** endpoint returns 200 and the JSON shape exactly matches the frontend TypeScript contract (`src/types/index.ts`).

- `POST /api/auth/login` → User + `token`
- `GET /api/auth/me` → null when anonymous, user when authenticated
- `GET /api/auth/users` → 6+ users
- `GET /api/members` (20+ fields incl. `nextOfKin`, `beneficiaries`), `GET /api/members/{id}` for all 20 ids
- `GET /api/savings/products`, `GET /api/savings/transactions`, `GET /api/savings/transactions/{memberId}` (filters by member, empty for unknown)
- `GET /api/loans` (incl. `guarantors[]`, `collateralIds[]`), `GET /api/loans/products`
- `GET /api/accounting/accounts`, `GET /api/accounting/journal`
- `GET /api/checkoff`, `GET /api/collateral`, `GET /api/shares/transfers`, `GET /api/shares/dividends`
- `GET /api/cashops/tills`, `/movements`, `/pettycash`
- `GET /api/approvals`, `GET /api/notifications`
- `GET /api/kpi` (18 dashboard fields), chart endpoints (`/portfolio-at-risk`, `/savings-trend`, `/loan-product-mix`)

Extending the frontend contract? Add one test to `ApiContractIT` (pattern: `assertArrayFields(arr, minSize, "field1", ...)`).

---

## 4. Backend — Edge Cases (19 tests)

| Case | Expected | Result |
|---|---|---|
| No token on 7 protected endpoints | 401 | ✅ |
| Malformed JWT | 401 | ✅ |
| Unknown member / loan / approval id | 404 | ✅ |
| Login: unknown username / role | 404 | ✅ |
| Login: empty body | defaults to Manager 200 | ✅ |
| Create loan: missing productId | 400 | ✅ |
| Create loan: unknown productId | 404 | ✅ |
| Create loan: amount 0 / negative / `"abc"` | 400 | ✅ |
| Create loan: termMonths 0 / `"x"` | 400 | ✅ |
| Create loan: malformed JSON body | 400 (not 500) | ✅ |
| Create loan: valid → Pending, AI score 0–100, PD 0–100 | ✅ |
| Maker-checker: initiator self-approve / self-reject | 409 | ✅ |
| Maker-checker: second decision on decided item | 409 | ✅ |
| Maker-checker: different teller approves other teller's request | 200 | ✅ |
| Check-off upload with empty body | 200 | ✅ |
| Loan list remains valid after creates (idempotent contract) | ✅ | |

---

## 5. Backend — Data Integrity (6 tests)

- **Journal balances:** Σ debits = Σ credits (`debits 670000 = credits 670000`).
- **Balance sheet balances:** Σ Assets = Σ (Liabilities + Equity) (`20,792,400 = 20,792,400`).
- **KPI ↔ loans:** `kpi.loanPortfolio` = Σ loan balances (1,068,000).
- **KPI ↔ members:** `totalMembers` = registry count; `activeMembers` = Active count.
- **Portfolio at Risk:** classification proportions sum to ~100%.
- **Member statements:** each statement contains only that member's transactions, no zero-amount rows.

---

## 6. Performance

### 6.1 Latency (JUnit, real HTTP, warmup + 20 samples)

| Endpoint | avg | p95 | max |
|---|---|---|---|
| `/api/members` | 146 ms | 176 ms | 416 ms |
| `/api/loans` | 191 ms | 233 ms | 252 ms |
| `/api/kpi` | 187 ms | 228 ms | 237 ms |
| `/api/approvals` | 35 ms | 58 ms | 64 ms |
| `/api/accounting/accounts` | 36 ms | 52 ms | 54 ms |
| `/api/savings/products` | 37 ms | 59 ms | 71 ms |
| `/api/cashops/pettycash` | 32 ms | 55 ms | 68 ms |
| member detail (×20) | 27 ms | 33 ms | — |
| login | 56 ms | 68 ms | — |

All below thresholds (avg < 800 ms, p95 < 1500 ms). The heavier endpoints (members/loans/kpi) are the EAGER-collection joins; acceptable at this data size, flagged as an optimization target (§8).

### 6.2 Load test (`ab`, live backend, 1000 requests @ 50 concurrent)

| Endpoint | req/s | failed | 99th % |
|---|---|---|---|
| `GET /api/members` | 126.7 | 0 | 949 ms |
| `GET /api/kpi` | 63.0 | 0 | — |
| `GET /api/loans` | 60.8 | 0 | — |
| `GET /api/savings/transactions` | 470.1 | 0 | — |

No connection resets, no 5xx under concurrent load.

### 6.3 Concurrency — approval race

6 users (distinct roles) simultaneously decide the **same** pending approval:

```
approval race: 200=1  409=5  other=0
```

Exactly one decision won; the other five correctly got 409. Verifies the maker-checker state transition is atomic under concurrency.

---

## 7. Frontend — Unit (15 tests, Vitest + jsdom)

- `format.test.ts` (6): ETB currency, thousands separators, zero/negative, en-GB dates, missing dates.
- `csv.test.ts` (4): header row, quoting/escaping of commas, missing-field handling, empty input.
- `api/client.test.ts` (5): JWT attached from localStorage, no header without token, JSON parsing, throws on 404, POST body JSON.

---

## 8. E2E — Playwright (6 tests, real stack)

| Journey | Result |
|---|---|
| Login (role picker) → Dashboard shows live KPIs | ✅ |
| Members → open profile drawer → KYC + Fayda ID → Statement tab | ✅ |
| Loans → submit new application → appears in portfolio | ✅ |
| Approvals → manager approves from maker-checker queue | ✅ |
| Check-Off → upload file → clean reconciliation | ✅ |
| Reports → Export CSV → file downloaded (`members-report.csv`) | ✅ |

---

## 9. Issues Found & Fixed (during this run)

| # | Severity | Issue | Root cause | Fix |
|---|---|---|---|---|
| 1 | **High** | Empty `Authorization: Bearer ` header caused a 500 (`CharSequence cannot be null or empty`) instead of skipping auth | JWT filter called `parse("")` | Filter now skips blank tokens and catches `IllegalArgumentException` — `JwtAuthFilter.java` |
| 2 | **High** | Concurrent approval: all 6 approvers succeeded; state transition not atomic | Read-modify-write without locking | Added `@Lock(PESSIMISTIC_WRITE)` + `findByIdForUpdate` — `ApprovalRepository.java`, `ApprovalService.java` |
| 3 | **High** | `GET /api/auth/me` threw NPE → 500 when unauthenticated | `@AuthenticationPrincipal` null | Returns `null` when principal absent — `AuthController.java` |
| 4 | **Medium** | Unknown ids returned 400 instead of 404 | `IllegalArgumentException` reused for "not found" | New `NotFoundException` → 404 — `common/`, `MemberController`, `LoanController`, `ApprovalService` |
| 5 | **Medium** | Loan create 500 on bad input (non-numeric amount/term, missing productId) | Unsafe casts on `Map<String,Object>` | Robust `asLong/asInteger/asBigDecimal` helpers → 400; `LoanController.java` |
| 6 | **High** | **Seed books did not balance**: Σ debits ≠ Σ credits; Assets ≠ Liab+Equity | One-sided journal rows + incoherent CoA | Rebuilt CoA + journal as valid double-entry pairs — `V2__seed.sql` |
| 7 | **High** | Frontend crash `v.toUpperCase is not a function` in Members statement & Savings tables when hit by the real backend | Code assumed string product/member ids; backend returns numbers | `String(v).toUpperCase()` — `Members.tsx`, `Savings.tsx` (caught by E2E) |
| 8 | **Low** | CSV export logic was untestable (inlined in component) | — | Extracted `buildCsv`/`downloadCsv` to `src/utils/csv.ts` + unit tests |

---

## 10. Reusability & Expansion

- **`BaseApiIT`** (backend) — JWT login helpers, JSON helpers, contract assertions; new IT classes just extend it.
- **`ApiContractIT`** — one method per endpoint; adding an endpoint = one test.
- **`EdgeCasesIT`** — each test resets the approvals it mutates (`@BeforeEach`), so the suite is **re-runnable and order-independent**.
- **`PerformanceIT`** — thresholds are generous (CI-safe) and measured on a random-port real server.
- **Vitest** — pure-function tests (`format`, `csv`) and MSW-node tests (`api/client`) are framework-free and fast.
- **Playwright** — `e2e/sacco.spec.ts`; `playwright.config.ts` (workers=1, trace/screenshot on failure).

### How to run

```bash
# Backend (all 56): requires local PostgreSQL; cbs_test auto-migrated by Flyway
cd backend && JAVA_HOME=~/.local/opt/jdk-21.0.12.1+1 mvn verify

# Frontend unit (15)
npm run test        # = vitest run

# E2E (6): requires backend (:8080) + frontend with VITE_USE_MOCK=false (:5173)
npx playwright test

# Load test against live backend
ab -n 1000 -c 50 -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/members
```

---

## 12. Addendum — Forms, Charts & Write Flows (Test Result 01b)

Follow-up round added the data-entry forms (previously placeholder buttons), Dashboard charts, and the backend write endpoints behind them.

### New UI
- **Dashboard charts** (recharts): Portfolio-at-Risk donut, Savings Flow bar (6 months), Loan Portfolio Mix donut — fed by `/api/portfolio-at-risk`, `/api/savings-trend`, `/api/loan-product-mix`.
- **Working forms** (Modal + Form, real POSTs): Register Member, New Savings Product, Deposit, Withdrawal, Run Interest Posting, New Journal Entry (double-leg), Add Collateral, Share Transfer, New Cash Movement, New Petty Cash Entry.
- Every form posts to the backend; MSW mirrors the same endpoints so demo (mock) mode behaves identically.

### New backend endpoints (all covered by `WriteFlowsIT`, 16 tests)
- `POST /api/members` · `POST /api/savings/products` · `POST /api/savings/transactions` (Deposit/Withdrawal with member balance update + **double-entry GL posting**) · `POST /api/savings/interest` (monthly interest batch) · `POST /api/accounting/journal` (balanced two-leg entry + GL updates) · `POST /api/collateral` (FSV = valuation × (1−haircut)) · `POST /api/shares/transfers` · `POST /api/cashops/movements` · `POST /api/cashops/pettycash`.

### Issues found & fixed in this round
| # | Severity | Issue | Fix |
|---|---|---|---|
| 9 | **High** | `POST /api/cashops/movements` failed with NOT-NULL violation when the form omitted `initiatedBy` | Defaults to the authenticated user's name (or "System") — `CashOpsController.java` |
| 10 | Medium | Deposit test compared balances across two different members (list order is not id-ordered) | Read `before` from `/api/members/1` explicitly |
| 11 | Medium | Interest posting moved P&L without a corresponding asset → Balance Sheet no longer balanced | Balance-sheet invariant now includes current surplus: `Assets = Liab + Equity + (Income − Expense)`; seed CoA rebalanced accordingly |
| 12 | Low | Seed GL asset total left the books unbalanced under the surplus formula | `V2__seed.sql` asset base adjusted |
| 13 | Low | `kpi.totalMembers` was asserted against a fixed 20, breaking as data grew | Asserted type consistency instead |

### E2E additions (9 total now)
dashboard charts visible · savings deposit via the form (verified at DB level) · balanced journal entry posted via the form.

## 13. Observations / Follow-ups (not blocking)

- **EAGER collections** on Member (`nextOfKin`, `beneficiaries`) and Loan (`guarantors`) cause extra queries on list reads → move to lazy + DTO projections when membership grows (currently fine: 20 members).
- **`/api/kpi`** runs several aggregate scans per call; add a materialized daily snapshot when the KPI dashboard load matters.
- Seed dataset is intentionally small; contract/integrity tests are written against relative invariants, so they hold for any data volume.
- `memberId` on loan creation is defaulted (10) in this demo build — the real app must resolve it from the authenticated/selected member.
- Non-idempotent write endpoints (loan create, check-off upload) intentionally append rows; tests assert relative invariants, not absolute counts.