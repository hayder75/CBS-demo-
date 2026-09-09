#!/usr/bin/env bash
# API smoke test (no browser). Verifies every endpoint group responds 2xx.
# Requires the backend running on :8080 (./backend mvn spring-boot:run).

set -euo pipefail

BASE="http://localhost:8080"
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"username":"admin"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

fail=0
check() {
  local name="$1"; local method="${2:-GET}"; local path="$3"; local body="${4:-}"
  local code
  if [ "$method" = "POST" ] && [ -n "$body" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE$path" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$body")
  else
    code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" -H "Authorization: Bearer $TOKEN")
  fi
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    printf '  ok  %-24s %s -> %s\n' "$name" "$method" "$code"
  else
    printf 'FAIL  %-24s %s -> %s\n' "$name" "$method" "$code"
    fail=1
  fi
}

echo "== API smoke (real backend) =="
check "login" GET "/api/auth/users"
check "members" GET "/api/members"
check "savings products" GET "/api/savings/products"
check "savings transactions" GET "/api/savings/transactions"
check "loans" GET "/api/loans"
check "loans products" GET "/api/loans/products"
check "accounting accounts" GET "/api/accounting/accounts"
check "accounting journal" GET "/api/accounting/journal"
check "checkoff" GET "/api/checkoff"
check "collateral" GET "/api/collateral"
check "shares transfers" GET "/api/shares/transfers"
check "shares dividends" GET "/api/shares/dividends"
check "cashops tills" GET "/api/cashops/tills"
check "cashops movements" GET "/api/cashops/movements"
check "cashops pettycash" GET "/api/cashops/pettycash"
check "approvals" GET "/api/approvals"
check "branches" GET "/api/branches"
check "currencies" GET "/api/currencies"
check "payment-modes" GET "/api/payment-modes"
check "vaults" GET "/api/vaults"
check "accounts" GET "/api/accounts"
check "share-categories" GET "/api/share-categories"
check "share-accounts" GET "/api/share-accounts"
check "charges" GET "/api/charges"
check "reservations" GET "/api/reservations"
check "transaction-limits" GET "/api/transaction-limits"
check "loan-categories" GET "/api/loan-categories"
check "loan-groups" GET "/api/loan-groups"
check "committees" GET "/api/committees"
check "batch-jobs" GET "/api/batch-jobs"
check "assets" GET "/api/assets"
check "coa classes" GET "/api/coa/classes"
check "payments" GET "/api/payments"
check "audit logs" GET "/api/audit/logs"
check "daily ops" GET "/api/dop"
check "report loan-aging" GET "/api/reports/loan-aging"
check "report delinquency" GET "/api/reports/delinquency"
check "report transactions" GET "/api/reports/transactions"
check "report customers" GET "/api/reports/customers"

echo ""
if [ "$fail" -eq 0 ]; then
  echo "ALL ENDPOINTS OK"
else
  echo "ONE OR MORE ENDPOINTS FAILED"
  exit 1
fi