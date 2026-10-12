package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 9 — global search parity.
 */
class SearchParityIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("manager");
    }

    @Test
    @DisplayName("GET /api/search?type=Customer returns customers")
    void searchCustomers() throws Exception {
        JsonNode n = get("/api/search?type=Customer&q=", token());
        assertHasFields(n, "type", "query", "count", "results");
        assertEquals("Customer", n.get("type").asText());
        assertTrue(n.get("results").isArray() && n.get("results").size() > 0);
        assertHasFields(n.get("results").get(0), "title", "subtitle", "detail", "ref");
    }

    @Test
    @DisplayName("search supports account, share, GL, document, transaction, loan types")
    void searchAllTypes() throws Exception {
        for (String type : new String[]{"Account", "Share", "GL", "Document", "Transaction", "Loan"}) {
            JsonNode n = get("/api/search?type=" + type + "&q=", token());
            assertEquals(type, n.get("type").asText());
            assertTrue(n.get("results").isArray(), type + " should return results array");
        }
    }

    @Test
    @DisplayName("search filters by query text")
    void searchFiltering() throws Exception {
        JsonNode all = get("/api/search?type=Customer&q=", token());
        JsonNode filtered = get("/api/search?type=Customer&q=zzzznotfound", token());
        assertEquals(0, filtered.get("count").asInt());
        assertTrue(all.get("count").asInt() >= filtered.get("count").asInt());
    }
}
