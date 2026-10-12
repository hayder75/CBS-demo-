package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 5 — finance parity: cash position, daily trial balance, income statement, opening balance.
 */
class FinanceParityIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("accountant");
    }

    @Test
    @DisplayName("GET /api/finance/cash-position returns totals and accounts")
    void cashPosition() throws Exception {
        JsonNode n = get("/api/finance/cash-position", token());
        assertHasFields(n, "total", "accounts", "asOf");
        assertTrue(n.get("accounts").isArray());
    }

    @Test
    @DisplayName("GET /api/finance/daily-trial-balance returns debit/credit columns")
    void dailyTrialBalance() throws Exception {
        JsonNode n = get("/api/finance/daily-trial-balance", token());
        assertHasFields(n, "rows", "totalDebit", "totalCredit");
        assertTrue(n.get("rows").isArray() && n.get("rows").size() > 0);
        if (n.get("rows").size() > 0) {
            assertHasFields(n.get("rows").get(0), "code", "name", "debit", "credit");
        }
        assertTrue(n.get("totalDebit").isNumber() && n.get("totalCredit").isNumber());
    }

    @Test
    @DisplayName("GET /api/finance/income-statement returns surplus")
    void incomeStatement() throws Exception {
        JsonNode n = get("/api/finance/income-statement", token());
        assertHasFields(n, "income", "expense", "totalIncome", "totalExpense", "netSurplus");
        assertTrue(n.get("income").isArray());
    }

    @Test
    @DisplayName("GET/POST /api/finance/opening-balance round-trips")
    void openingBalance() throws Exception {
        JsonNode list = get("/api/finance/opening-balance", token());
        assertTrue(list.isArray() && list.size() > 0);
        String code = list.get(0).get("code").asText();
        java.math.BigDecimal original = list.get(0).get("balance").decimalValue();

        JsonNode set = post("/api/finance/opening-balance", Map.of("code", code, "amount", 1234.56), token(), 200);
        assertEquals(code, set.get("code").asText());
        assertEquals(0, set.get("balance").decimalValue().compareTo(new java.math.BigDecimal("1234.56")));

        // restore so other tests (e.g. trial balance) are unaffected
        post("/api/finance/opening-balance", Map.of("code", code, "amount", original), token(), 200);

        post("/api/finance/opening-balance", Map.of("code", "NOPE", "amount", 1), token(), 404);
    }
}
