package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies every REST endpoint exists, returns 200, and that the JSON shape
 * exactly matches the frontend TS contract (src/types/index.ts). Adding a new
 * endpoint to the frontend contract? Add a test here.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApiContractIT extends BaseApiIT {

    private String token;

    private String token() throws Exception {
        if (token == null) token = loginTokenByRole("MANAGER");
        return token;
    }

    @Test
    @Order(1)
    @DisplayName("POST /api/auth/login returns User+token contract")
    void loginContract() throws Exception {
        JsonNode n = post("/api/auth/login", Map.of("role", "MANAGER"), "", 200);
        assertHasFields(n, "id", "username", "name", "role", "title", "branch", "lastLogin", "token");
        assertEquals("MANAGER", n.get("role").asText());
        assertTrue(n.get("token").asText().length() > 30);
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/auth/users returns User list")
    void usersContract() throws Exception {
        JsonNode n = get("/api/auth/users", token());
        assertTrue(n.isArray() && n.size() >= 6);
        assertHasFields(n.get(0), "id", "username", "name", "role", "title", "branch", "lastLogin");
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/auth/me returns null when unauthenticated, user when authenticated")
    void meContract() throws Exception {
        JsonNode anon = get("/api/auth/me", "no-token", 200);
        assertTrue(anon == null || anon.isNull(), "unauthenticated /me should be null");
        JsonNode auth = get("/api/auth/me", token());
        assertHasFields(auth, "id", "username", "name", "role");
        assertEquals("MANAGER", auth.get("role").asText());
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/members -> Member[] contract")
    void membersContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/members", token());
        assertArrayFields(arr, 20,
                "id", "memberNo", "fullName", "gender", "birthDate", "phone", "email",
                "faydaId", "kebele", "woreda", "city", "occupation", "employer", "status",
                "joinDate", "photoColor", "shareBalance", "savingsBalance", "loanOutstanding",
                "nextOfKin", "beneficiaries");
        JsonNode m = arr.get(0);
        assertHasFields(m.get("nextOfKin").get(0), "name", "relation", "phone");
        assertHasFields(m.get("beneficiaries").get(0), "name", "relation", "percent", "phone");
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/members/{id} works for all seeded ids")
    void memberByIdContract() throws Exception {
        for (long id = 1; id <= 20; id++) {
            JsonNode n = get("/api/members/" + id, token());
            assertEquals(id, n.get("id").asLong());
            assertTrue(n.get("fullName").asText().length() > 3);
        }
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/savings/products -> SavingsProduct[] contract")
    void savingsProductsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/savings/products", token());
        assertArrayFields(arr, 5, "id", "code", "name", "type", "interestRatePct", "minBalance", "noticePeriodDays");
    }

    @Test
    @Order(7)
    @DisplayName("GET /api/savings/transactions -> SavingsTransaction[] contract")
    void savingsTransactionsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/savings/transactions", token());
        assertArrayFields(arr, 10, "id", "memberId", "productId", "date", "type", "amount", "teller", "channel");
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/savings/transactions/{memberId} filters by member")
    void savingsByMemberContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/savings/transactions/1", token());
        assertTrue(arr.size() >= 3);
        for (JsonNode t : arr) assertEquals(1, t.get("memberId").asLong());
        ArrayNode none = (ArrayNode) get("/api/savings/transactions/9999", token());
        assertEquals(0, none.size(), "unknown member should return empty list, not error");
    }

    @Test
    @Order(9)
    @DisplayName("GET /api/loans -> Loan[] contract (guarantors + collateralIds)")
    void loansContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/loans", token());
        assertArrayFields(arr, 9,
                "id", "loanNo", "memberId", "memberName", "productId", "productName", "status",
                "amount", "disbursedAt", "termMonths", "ratePct", "scheduleType", "principalPaid",
                "interestPaid", "balance", "overdueDays", "classification", "guarantors",
                "collateralIds", "aiScore", "aiPdPct", "aiGuidance", "nextDueDate");
        JsonNode loan = arr.get(0);
        assertTrue(loan.get("guarantors").isArray());
        assertTrue(loan.get("collateralIds").isArray());
    }

    @Test
    @Order(10)
    @DisplayName("GET /api/loans/products -> LoanProduct[] contract")
    void loanProductsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/loans/products", token());
        assertArrayFields(arr, 5, "id", "code", "name", "ratePct", "maxTermMonths", "maxAmount", "schedule", "processingFeePct");
    }

    @Test
    @Order(11)
    @DisplayName("GET /api/accounting/accounts -> GLAccount[] contract")
    void accountsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/accounting/accounts", token());
        assertArrayFields(arr, 10, "id", "code", "name", "category", "balance");
    }

    @Test
    @Order(12)
    @DisplayName("GET /api/accounting/journal -> JournalEntry[] contract")
    void journalContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/accounting/journal", token());
        assertArrayFields(arr, 5, "id", "date", "ref", "description", "accountCode", "accountName", "debit", "credit", "postedBy");
    }

    @Test
    @Order(13)
    @DisplayName("GET /api/checkoff -> CheckOffBatch[] contract")
    void checkOffContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/checkoff", token());
        assertArrayFields(arr, 3, "id", "employer", "month", "uploadedAt", "rows", "matched", "unmatched", "expected", "received", "variance", "status");
    }

    @Test
    @Order(14)
    @DisplayName("GET /api/collateral -> Collateral[] contract")
    void collateralContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/collateral", token());
        assertArrayFields(arr, 3, "id", "code", "type", "owner", "description", "valuation",
                "forcedSaleValue", "discountPct", "loanId", "loanRef", "insuranceExpiry", "status");
    }

    @Test
    @Order(15)
    @DisplayName("GET /api/shares/transfers + /api/shares/dividends contract")
    void sharesContract() throws Exception {
        ArrayNode transfers = (ArrayNode) get("/api/shares/transfers", token());
        assertArrayFields(transfers, 2, "id", "date", "fromMember", "toMember", "shares", "value", "status");
        ArrayNode dividends = (ArrayNode) get("/api/shares/dividends", token());
        assertArrayFields(dividends, 2, "id", "year", "totalSurplus", "statutoryReserve", "distributable",
                "eligibleMembers", "dividendPerShare", "totalDistribution", "status");
    }

    @Test
    @Order(16)
    @DisplayName("GET /api/cashops endpoints contract")
    void cashOpsContract() throws Exception {
        ArrayNode tills = (ArrayNode) get("/api/cashops/tills", token());
        assertArrayFields(tills, 1, "id", "teller", "opening", "deposits", "withdrawals", "closing", "expected", "variance", "status");
        ArrayNode movements = (ArrayNode) get("/api/cashops/movements", token());
        assertArrayFields(movements, 2, "id", "date", "from", "to", "amount", "initiatedBy", "approvedBy", "status", "type");
        ArrayNode petty = (ArrayNode) get("/api/cashops/pettycash", token());
        assertArrayFields(petty, 2, "id", "date", "description", "category", "amount", "receiptNo", "status");
    }

    @Test
    @Order(17)
    @DisplayName("GET /api/approvals -> ApprovalItem[] contract")
    void approvalsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/approvals", token());
        assertArrayFields(arr, 5, "id", "type", "ref", "summary", "amount", "initiatedBy", "requestedAt", "status");
    }

    @Test
    @Order(18)
    @DisplayName("GET /api/notifications -> Notification[] contract")
    void notificationsContract() throws Exception {
        ArrayNode arr = (ArrayNode) get("/api/notifications", token());
        assertArrayFields(arr, 3, "id", "memberId", "memberName", "channel", "type", "message", "sentAt");
    }

    @Test
    @Order(19)
    @DisplayName("GET /api/kpi -> Kpi contract (all dashboard fields)")
    void kpiContract() throws Exception {
        JsonNode n = get("/api/kpi", token());
        assertHasFields(n, "totalMembers", "activeMembers", "newMembersThisMonth", "totalSavings",
                "totalDepositsThisMonth", "loanPortfolio", "loanDisbursedThisMonth", "overdueLoans",
                "parPct", "cashOnHand", "cashAtBank", "incomeThisMonth", "expenseThisMonth",
                "surplusThisMonth", "membersGrowthPct", "savingsGrowthPct", "dividendPerShare", "approvalsPending");
        Map<String, Class<?>> types = new HashMap<>();
        types.put("totalMembers", Integer.class);
        types.put("loanPortfolio", Integer.class);
        types.put("parPct", Integer.class);
        types.put("approvalsPending", Integer.class);
        assertTypes(n, types);
    }

    @Test
    @Order(20)
    @DisplayName("Chart endpoints contract")
    void chartContract() throws Exception {
        ArrayNode par = (ArrayNode) get("/api/portfolio-at-risk", token());
        assertArrayFields(par, 5, "label", "value", "color");
        ArrayNode trend = (ArrayNode) get("/api/savings-trend", token());
        assertArrayFields(trend, 5, "month", "deposits", "withdrawals");
        ArrayNode mix = (ArrayNode) get("/api/loan-product-mix", token());
        assertArrayFields(mix, 3, "name", "value");
    }
}