package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the Franc Core Banking parity modules added in V3/V4:
 * branches, currencies, payment modes, vaults, accounts, share categories,
 * charges, reservations, transaction limits, loan infrastructure, batch jobs,
 * fixed assets, GL classes, payments (maker-checker), auditing, daily
 * operations, reports and the loan lifecycle.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FrancModulesIT extends BaseApiIT {

    private String token;

    private String token() throws Exception {
        if (token == null) token = loginTokenByRole("MANAGER");
        return token;
    }

    @Test
    @Order(1)
    @DisplayName("Branches list + create + verify")
    void branches() throws Exception {
        JsonNode list = get("/api/branches", token());
        assertTrue(list.size() >= 3, "seeded branches present");
        assertHasFields(list.get(0), "id", "code", "name", "status");

        JsonNode created = post("/api/branches", Map.of(
                "code", "X" + System.currentTimeMillis() % 10000,
                "name", "Test Branch", "address", "Addis"), token(), 200);
        assertEquals("Pending", created.get("status").asText());
        long id = created.get("id").asLong();
        JsonNode verified = post("/api/branches/" + id + "/verify", Map.of(), token(), 200);
        assertEquals("Verified", verified.get("status").asText());
    }

    @Test
    @Order(2)
    @DisplayName("Currencies, payment modes, vaults, share categories, charges CRUD+verify")
    void registrations() throws Exception {
        String u = "T" + System.currentTimeMillis() % 100000;
        JsonNode cur = post("/api/currencies", Map.of("code", u, "name", "Kenyan Shilling", "exchangeRate", 1.0), token(), 200);
        assertHasFields(cur, "id", "code", "exchangeRate");

        JsonNode mode = post("/api/payment-modes", Map.of("code", "P" + u, "name", "POS Terminal", "paymentType", "NON_CASH"), token(), 200);
        assertHasFields(mode, "id", "paymentType");

        JsonNode vault = post("/api/vaults", Map.of("code", "VA-" + u, "name", "Test Vault", "type", "BRANCH"), token(), 200);
        assertEquals("Pending", vault.get("status").asText());
        post("/api/vaults/" + vault.get("id").asLong() + "/verify", Map.of(), token(), 200);

        JsonNode sc = post("/api/share-categories", Map.of("code", "SH" + u, "name", "Test Share", "nominalPrice", 100), token(), 200);
        assertHasFields(sc, "id", "nominalPrice");

        JsonNode charge = post("/api/charges", Map.of("code", "CHG" + u, "name", "Test Charge", "calcType", "Flat", "amount", 50), token(), 200);
        assertHasFields(charge, "id", "calcType");
    }

    @Test
    @Order(3)
    @DisplayName("Accounts + reservations + transaction limits")
    void accounts() throws Exception {
        JsonNode acc = post("/api/accounts", Map.of("memberId", 1, "productId", 1, "accountType", "Saving"), token(), 200);
        assertHasFields(acc, "id", "accountNo", "status");
        assertEquals("Pending", acc.get("status").asText());
        long accId = acc.get("id").asLong();
        JsonNode active = post("/api/accounts/" + accId + "/verify", Map.of(), token(), 200);
        assertEquals("Active", active.get("status").asText());

        JsonNode res = post("/api/reservations", Map.of("accountId", accId, "memberId", 1, "amount", 5000, "reason", "hold"), token(), 200);
        assertHasFields(res, "id", "status");
        post("/api/reservations/" + res.get("id").asLong() + "/release", Map.of(), token(), 200);

        JsonNode limit = post("/api/transaction-limits", Map.of("roleCode", "ROLE" + System.currentTimeMillis() % 100000, "txnType", "TRANSFER", "maxAmount", 75000), token(), 200);
        assertHasFields(limit, "id", "maxAmount");
    }

    @Test
    @Order(4)
    @DisplayName("Loan categories/groups/committees + batch jobs + fixed assets + GL classes")
    void loanInfraAndOps() throws Exception {
        String u = "T" + System.currentTimeMillis() % 100000;
        JsonNode cat = post("/api/loan-categories", Map.of("name", "Category " + u, "description", "d"), token(), 200);
        assertEquals("Pending", cat.get("status").asText());
        post("/api/loan-categories/" + cat.get("id").asLong() + "/verify", Map.of(), token(), 200);

        JsonNode grp = post("/api/loan-groups", Map.of("code", "GRP" + u, "name", "Test Group", "maxMembers", 10), token(), 200);
        assertHasFields(grp, "id");
        post("/api/loan-groups/" + grp.get("id").asLong() + "/verify", Map.of(), token(), 200);

        JsonNode comm = post("/api/committees", Map.of("name", "Committee " + u, "minAmount", 0, "maxAmount", 100000), token(), 200);
        assertHasFields(comm, "id", "minAmount");

        JsonNode job = post("/api/batch-jobs", Map.of("jobType", "DEPRECIATION", "name", "Test Dep"), token(), 200);
        assertHasFields(job, "id", "status");
        post("/api/batch-jobs/" + job.get("id").asLong() + "/run", Map.of(), token(), 200);

        JsonNode asset = post("/api/assets", Map.of("code", "AST" + u, "name", "Test Asset", "value", 100000, "depreciationRate", 20), token(), 200);
        assertHasFields(asset, "id", "value");
        JsonNode dep = post("/api/assets/" + asset.get("id").asLong() + "/depreciate", Map.of(), token(), 200);
        assertTrue(dep.get("value").asDouble() < 100000, "depreciated value reduced");

        JsonNode cls = post("/api/coa/classes", Map.of("name", "Class " + u), token(), 200);
        assertEquals("Pending", cls.get("status").asText());
        post("/api/coa/classes/" + cls.get("id").asLong() + "/verify", Map.of(), token(), 200);
    }

    @Test
    @Order(5)
    @DisplayName("Payments: create (maker) -> authorize (checker) -> reverse")
    void paymentMakerChecker() throws Exception {
        JsonNode p = post("/api/payments", Map.of(
                "kind", "DEPOSIT",
                "accountId", 1,
                "amount", 1000,
                "paymentModeId", 1,
                "description", "test deposit"), token(), 200);
        assertHasFields(p, "id", "paymentNo", "kind", "status");
        assertEquals("Pending", p.get("status").asText());
        long id = p.get("id").asLong();

        JsonNode authed = post("/api/payments/" + id + "/authorize", Map.of(), token(), 200);
        assertEquals("Authorized", authed.get("status").asText());

        post("/api/payments/" + id + "/reverse", Map.of(), token(), 200);
    }

    @Test
    @Order(6)
    @DisplayName("Daily operations start/close")
    void dailyOps() throws Exception {
        JsonNode start = post("/api/dop/start", Map.of("branchId", 2, "vaultId", 2, "openedBy", "Test"), token(), 200);
        assertHasFields(start, "id", "status");
        JsonNode close = post("/api/dop/close", Map.of("closedBy", "Test"), token(), 200);
        assertEquals("Closed", close.get("status").asText());
    }

    @Test
    @Order(7)
    @DisplayName("Reports endpoints return expected shapes")
    void reports() throws Exception {
        JsonNode aging = get("/api/reports/loan-aging", token());
        assertTrue(aging.isArray());
        if (aging.size() > 0) assertHasFields(aging.get(0), "bucket", "count", "balance");

        JsonNode tx = get("/api/reports/transactions", token());
        assertHasFields(tx, "deposits", "withdrawals", "total");

        JsonNode customers = get("/api/reports/customers", token());
        assertHasFields(customers, "total", "active");

        JsonNode top = get("/api/reports/top-borrowers", token());
        assertTrue(top.isArray());
    }

    @Test
    @Order(8)
    @DisplayName("Share accounts: create/verify + upgrade/downgrade decide")
    void shareAccounts() throws Exception {
        JsonNode sa = post("/api/share-accounts", Map.of("memberId", 1, "categoryId", 1, "shareCount", 10, "description", "test"), token(), 200);
        assertEquals("Pending", sa.get("status").asText());
        post("/api/share-accounts/" + sa.get("id").asLong() + "/verify", Map.of(), token(), 200);

        JsonNode req = post("/api/share-accounts/" + sa.get("id").asLong() + "/upgrade", Map.of("shareCount", 5), token(), 200);
        assertHasFields(req, "id", "requestType", "status");
        assertEquals("UPGRADE", req.get("requestType").asText());

        JsonNode decided = post("/api/share-accounts/requests/" + req.get("id").asLong() + "/decide?approve=true", Map.of(), token(), 200);
        assertEquals("Approved", decided.get("status").asText());

        JsonNode shareAcc = get("/api/share-accounts/" + sa.get("id").asLong(), token());
        assertTrue(shareAcc.get("shareCount").asInt() >= 15, "upgrade increased share count");
    }

    @Test
    @Order(9)
    @DisplayName("Payments: reject, mass transfer, by-kind/status filters")
    void paymentFiltersAndReject() throws Exception {
        JsonNode p = post("/api/payments", Map.of(
                "kind", "WITHDRAWAL", "accountId", 1, "amount", 500, "paymentModeId", 1), token(), 200);
        long id = p.get("id").asLong();
        JsonNode rejected = post("/api/payments/" + id + "/reject", Map.of(), token(), 200);
        assertEquals("Rejected", rejected.get("status").asText());

        JsonNode byKind = get("/api/payments/kind/DEPOSIT", token());
        assertTrue(byKind.isArray());

        JsonNode byStatus = get("/api/payments/status/Pending", token());
        assertTrue(byStatus.isArray());

        Map<String, Object> leg = Map.of(
                "kind", "TRANSFER", "accountId", 1, "amount", 100, "paymentModeId", 1, "description", "leg1");
        JsonNode mass = post("/api/payments/mass-transfer", Map.of("legs", List.of(leg, leg)), token(), 200);
        assertHasFields(mass, "posted");
        assertTrue(mass.get("posted").asInt() >= 1);
    }

    @Test
    @Order(10)
    @DisplayName("Auditing: exact / discrepant / unaudit + logs")
    void auditWorkflow() throws Exception {
        JsonNode unaudited = get("/api/audit/transactions?status=Unaudited", token());
        assertTrue(unaudited.isArray());
        if (unaudited.size() > 0) {
            long id = unaudited.get(0).get("id").asLong();
            JsonNode exact = post("/api/audit/transactions/" + id + "/exact", Map.of(), token(), 200);
            assertEquals("Audited", exact.get("auditedStatus").asText());

            JsonNode unaudit = post("/api/audit/transactions/" + id + "/unaudit", Map.of(), token(), 200);
            assertEquals("Unaudited", unaudit.get("auditedStatus").asText());

            JsonNode disc = post("/api/audit/transactions/" + id + "/discrepant", Map.of("note", "mismatch"), token(), 200);
            assertEquals("Discrepant", disc.get("auditedStatus").asText());
        }

        JsonNode logs = get("/api/audit/logs", token());
        assertTrue(logs.isArray());
        if (logs.size() > 0) assertHasFields(logs.get(0), "username", "action", "occurred_at");
    }

    @Test
    @Order(11)
    @DisplayName("Loan rejection path blocks disbursement")
    void loanRejectPath() throws Exception {
        JsonNode loan = post("/api/loans", Map.of(
                "productId", 1, "memberId", 2, "amount", 40000, "termMonths", 12), token(), 200);
        long id = loan.get("id").asLong();
        JsonNode rejected = post("/api/loans/" + id + "/decide", Map.of("approve", false, "note", "insufficient", "decidedBy", "Manager"), token(), 200);
        assertEquals("Rejected", rejected.get("status").asText());

        post("/api/loans/" + id + "/disburse", Map.of(), token(), 409);
    }

    @Test
    @Order(12)
    @DisplayName("Reports: gender/product/customers/shares/transactions")
    void reportMatrix() throws Exception {
        JsonNode byGender = get("/api/reports/loan-disbursement-by-gender", token());
        assertTrue(byGender.isArray());

        JsonNode byProduct = get("/api/reports/loan-disbursement-by-product", token());
        assertTrue(byProduct.isArray());

        JsonNode customers = get("/api/reports/customers", token());
        assertHasFields(customers, "total", "active", "dormant", "suspended");

        JsonNode shares = get("/api/reports/shares", token());
        assertHasFields(shares, "membersWithShares", "totalShareValue");
    }

    @Test
    @Order(13)
    @DisplayName("Loan lifecycle: create -> decide -> disburse -> amortization")
    void loanLifecycle() throws Exception {
        JsonNode loan = post("/api/loans", Map.of(
                "productId", 1,
                "memberId", 1,
                "amount", 50000,
                "termMonths", 12,
                "purpose", "Test loan"), token(), 200);
        assertHasFields(loan, "id", "loanNo", "status");
        assertEquals("Pending", loan.get("status").asText());
        long loanId = loan.get("id").asLong();

        JsonNode decided = post("/api/loans/" + loanId + "/decide", Map.of("approve", true, "note", "ok", "decidedBy", "Manager"), token(), 200);
        assertEquals("Approved", decided.get("status").asText());

        JsonNode disbursed = post("/api/loans/" + loanId + "/disburse", Map.of(), token(), 200);
        assertEquals("Disbursed", disbursed.get("status").asText());
        assertTrue(disbursed.get("balance").asDouble() > 0);

        JsonNode amort = get("/api/loans/" + loanId + "/amortization", token());
        assertTrue(amort.isArray() && amort.size() == 12, "12-month amortization rows");
        assertHasFields(amort.get(0), "period", "principal", "interest", "total", "balance");
    }
}