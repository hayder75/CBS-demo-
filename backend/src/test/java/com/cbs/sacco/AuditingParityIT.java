package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 3 — auditing parity: unaudited / audited-exact / audited-discrepant + head-office views.
 */
class AuditingParityIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("auditor");
    }

    @Test
    @DisplayName("GET /api/audit/transactions filters by audit status")
    void transactionsByStatus() throws Exception {
        JsonNode unaudited = get("/api/audit/transactions?status=Unaudited", token());
        assertTrue(unaudited.isArray());
        if (unaudited.size() > 0) {
            assertHasFields(unaudited.get(0), "id", "amount", "auditedStatus");
        }
        JsonNode all = get("/api/audit/transactions?status=all", token());
        assertTrue(all.size() >= unaudited.size());
    }

    @Test
    @DisplayName("audit workflow: exact -> discrepant -> unaudit")
    void auditWorkflow() throws Exception {
        JsonNode all = get("/api/audit/transactions?status=all", token());
        assertTrue(all.size() > 0, "seed should include transactions");
        long id = all.get(0).get("id").asLong();

        JsonNode exact = post("/api/audit/transactions/" + id + "/exact", Map.of(), token(), 200);
        assertEquals("Audited", exact.get("auditedStatus").asText());

        JsonNode disc = post("/api/audit/transactions/" + id + "/discrepant",
                Map.of("note", "Variance in receipt"), token(), 200);
        assertEquals("Discrepant", disc.get("auditedStatus").asText());
        assertEquals("Variance in receipt", disc.get("auditNote").asText());

        JsonNode un = post("/api/audit/transactions/" + id + "/unaudit", Map.of(), token(), 200);
        assertEquals("Unaudited", un.get("auditedStatus").asText());
    }

    @Test
    @DisplayName("GET /api/audit/ho-overview returns consolidated counts and teller breakdown")
    void hoOverview() throws Exception {
        JsonNode n = get("/api/audit/ho-overview", token());
        assertHasFields(n, "total", "auditedExact", "auditedDiscrepant", "unaudited", "byTeller");
        assertTrue(n.get("total").asInt() > 0);
        assertTrue(n.get("byTeller").isArray());
        if (n.get("byTeller").size() > 0) {
            assertHasFields(n.get("byTeller").get(0), "teller", "exact", "discrepant", "unaudited", "total");
        }
    }

    @Test
    @DisplayName("GET /api/audit/ho/transactions returns all-branch list")
    void hoTransactions() throws Exception {
        JsonNode all = get("/api/audit/ho/transactions?status=all", token());
        assertTrue(all.isArray() && all.size() > 0);
        JsonNode exact = get("/api/audit/ho/transactions?status=Audited", token());
        assertTrue(exact.isArray());
    }
}
