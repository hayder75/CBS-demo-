package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 1 — report framework contract tests: catalogue + generic runner.
 */
class ReportFrameworkIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("manager");
    }

    @Test
    @DisplayName("GET /api/reports/catalog returns categories and report definitions")
    void catalogContract() throws Exception {
        JsonNode n = get("/api/reports/catalog", token());
        assertTrue(n.has("total"), "catalog must expose total");
        assertTrue(n.get("total").asInt() >= 40, "expected 40+ reports, got " + n.get("total").asInt());
        assertTrue(n.get("categories").isArray() && n.get("categories").size() >= 10,
                "expected 10+ categories");

        JsonNode firstGroup = n.get("categories").get(0);
        assertHasFields(firstGroup, "category", "name", "reports");
        JsonNode firstReport = firstGroup.get("reports").get(0);
        assertHasFields(firstReport, "key", "name", "description", "columns", "params");
        assertTrue(firstReport.get("columns").size() > 0, "report must declare columns");
    }

    @Test
    @DisplayName("GET /api/reports/run executes trial balance")
    void trialBalanceRun() throws Exception {
        JsonNode n = get("/api/reports/run?key=financial-reports/trial-balance", token());
        assertHasFields(n, "key", "name", "columns", "rows", "total", "generatedAt");
        assertEquals("financial-reports/trial-balance", n.get("key").asText());
        assertTrue(n.get("columns").size() >= 5);
        assertTrue(n.get("rows").isArray());
        if (n.get("rows").size() > 0) {
            assertHasFields(n.get("rows").get(0), "code", "name", "debit", "credit", "balance");
        }
    }

    @Test
    @DisplayName("GET /api/reports/run executes loan status report with rows")
    void loanStatusRun() throws Exception {
        JsonNode n = get("/api/reports/run?key=general-loan-reports/loan-status-report", token());
        assertTrue(n.get("rows").isArray());
        assertTrue(n.get("total").asInt() > 0, "seeded loans should produce status buckets");
        JsonNode row = n.get("rows").get(0);
        assertHasFields(row, "status", "count", "balance");
    }

    @Test
    @DisplayName("GET /api/reports/run rejects unknown key with 400")
    void unknownReport() throws Exception {
        JsonNode n = get("/api/reports/run?key=does/not-exist", token(), 400);
        assertHasFields(n, "error");
    }

    @Test
    @DisplayName("catalog is reachable for every role")
    void catalogForAllRoles() throws Exception {
        for (String role : new String[]{"ADMIN", "MANAGER", "TELLER", "CREDIT_OFFICER", "ACCOUNTANT", "AUDITOR"}) {
            JsonNode n = get("/api/reports/catalog", loginTokenByRole(role));
            assertTrue(n.get("total").asInt() >= 40, "role " + role + " should see catalogue");
        }
    }

    @Test
    @DisplayName("every catalogued report runs and echoes its columns")
    void everyCataloguedReportRuns() throws Exception {
        JsonNode cat = get("/api/reports/catalog", token());
        int checked = 0;
        for (JsonNode group : cat.get("categories")) {
            for (JsonNode rep : group.get("reports")) {
                String key = rep.get("key").asText();
                JsonNode res = get("/api/reports/run?key=" + key, token());
                assertHasFields(res, "key", "name", "columns", "rows", "total", "generatedAt");
                assertEquals(key, res.get("key").asText());
                assertEquals(rep.get("columns").size(), res.get("columns").size(),
                        "column mismatch for " + key);
                assertTrue(res.get("rows").isArray(), key + " rows must be an array");
                checked++;
            }
        }
        assertTrue(checked >= 40, "expected to run 40+ reports, ran " + checked);
    }
}
