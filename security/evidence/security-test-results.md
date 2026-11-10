# Security Test Evidence — Anchor CBS / SACCO Core Banking

Date: 2026-11-11
Environment: local development
- Backend: Spring Boot 3.5.16 / Java 21, PostgreSQL 14.24, port 8080
- Frontend: React 19 + Vite, port 5173
- Commit under test: working tree (hardening batch)

## 1. Authentication and session controls

| Test | Command (summary) | Expected | Actual | Result |
|---|---|---|---|---|
| Login without password | `POST /api/auth/login {"username":"manager"}` | 401 | 401 `Invalid username or password` | PASS |
| Login with wrong password | `POST /api/auth/login {"username":"manager","password":"wrong"}` | 401 | 401 | PASS |
| Login with correct password | `POST /api/auth/login {"username":"manager","password":"demo123"}` | 200 + JWT | 200 + JWT | PASS |
| JWT lifetime | decode `exp - iat` | <= 1800 s | 1800 s (30 min) | PASS |
| Account lockout | 5 failed logins then correct password | 423 | 5×401, then 423 | PASS |
| MFA for manager (REQUIRE_MFA=true) | `POST /api/auth/login` | 202 `mfaRequired` | 202 `{"mfaRequired":true,...}` | PASS |
| MFA for teller (REQUIRE_MFA=true) | `POST /api/auth/login` | 200 | 200 | PASS |
| Password policy | `POST /api/auth/users` password `abc` | 400 | 400 “at least 8 characters…” | PASS |

## 2. Authorization (RBAC)

| Test | Expected | Actual | Result |
|---|---|---|---|
| `GET /api/auth/users` unauthenticated | 401 | 401 | PASS |
| `GET /api/auth/users` teller | 403 | 403 | PASS |
| `GET /api/auth/users` manager | 403 | 403 | PASS |
| `GET /api/auth/users` admin | 200 | 200 | PASS |
| Auditor `POST /api/sms/otp/send` | 403 | 403 | PASS |
| Teller `POST /api/gl-rules` | 403 | 403 | PASS |
| Teller `POST /api/compliance/policy` | 403 | 403 | PASS |
| Accountant `POST /api/gl-rules` | allowed (validation) | 400 | PASS |
| Teller `POST /api/savings/transactions` | allowed (validation) | 400 | PASS |
| Auditor `GET /api/audit-trail` | 200 | 200 | PASS |

## 3. Security headers and CORS

Request: `GET /api/auth/me` with `Origin: http://localhost:5173`.

Present:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (when `X-Forwarded-Proto: https`)
- `Access-Control-Allow-Origin: http://localhost:5173`

Disallowed origin `https://evil.example`: no `Access-Control-Allow-Origin` header. PASS.

## 4. Injection and input validation

| Test | Expected | Actual | Result |
|---|---|---|---|
| Login SQL injection `' OR 1=1--` | 401 | 401 | PASS |
| Negative expense amount | 400 | 400 “Amount must be greater than zero” | PASS |

## 5. Immutable audit trail

| Test | Expected | Actual | Result |
|---|---|---|---|
| `GET /api/audit-trail/verify` | valid chain | `{"valid":true,"checked":58}` | PASS |
| `UPDATE audit_trail` (psql) | rejected | `ERROR: This table is append-only…` | PASS |
| `DELETE FROM audit_trail` | rejected | `ERROR: This table is append-only…` | PASS |
| `UPDATE audit_log` (legacy) | rejected | `ERROR: This table is append-only…` | PASS |
| `DELETE FROM audit_log` | rejected | `ERROR: This table is append-only…` | PASS |
| `sms_log` mutation | rejected | trigger present (`sms_log_append_only`) | PASS |

## 6. Dependencies

`npm audit --omit=dev`:
- Before: 3 high (`@ant-design/pro-components`, `@ant-design/pro-layout`, `path-to-regexp`)
- Remediation: removed `@ant-design/pro-components` and `@ant-design/pro-layout`; replaced the only used component (`ProCard`, 40 usages) with a local `.page-shell` wrapper.
- After: **0 vulnerabilities** (info 0, low 0, moderate 0, high 0, critical 0).

## 7. Secrets

- `backend/.env` is gitignored; `git ls-files` does not include it.
- No AfroMessage API key in tracked files (`git grep`).
- JWT secret and DB password are read from environment variables.
- Production guard: with `PRODUCTION=true`, startup rejects the default `SEED_PASSWORD=demo123` and the demo JWT secret.

## 8. Build and regression

- `npx tsc -b`: clean.
- `VITE_USE_MOCK=true npm run build`: success.
- `npx vitest run`: 50/50 tests pass.
- `mvn -o -Dmaven.test.skip=true compile`: clean.

## 9. Not covered locally (deployment / external)

- TLS 1.3 termination and mTLS: nginx template provided (`deploy/nginx-cbs.conf.template`); not deployed on the audited host.
- Encryption at rest: depends on PostgreSQL/volume encryption at the hosting layer; application-level field encryption for Fayda ID/phone is not yet implemented.
- Independent penetration test, ISO/IEC 27001, ISO/IEC 15408, PCI-DSS certification: not performed/not certified. No cardholder data is stored by this platform.
