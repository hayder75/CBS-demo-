package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 8 — registration parity: document types and account state lifecycle.
 */
class RegistrationParityIT extends BaseApiIT {

    private static final String SFX = Long.toString(System.currentTimeMillis() % 100000);

    private String token() throws Exception {
        return loginToken("manager");
    }

    @Test
    @DisplayName("GET /api/documents returns seeded document types")
    void documentsList() throws Exception {
        JsonNode n = get("/api/documents", token());
        assertTrue(n.isArray() && n.size() >= 8);
        assertHasFields(n.get(0), "id", "code", "name", "category", "mandatory", "retentionYears", "status");
    }

    @Test
    @DisplayName("POST /api/documents creates, rejects duplicates, supports verify")
    void documentCreate() throws Exception {
        String code = "DOC_" + SFX;
        JsonNode created = post("/api/documents",
                Map.of("code", code, "name", "Test Doc", "category", "Customer", "mandatory", true),
                token(), 200);
        assertEquals(code, created.get("code").asText());
        assertEquals(true, created.get("mandatory").asBoolean());
        post("/api/documents", Map.of("code", code, "name", "Dup"), token(), 400);

        JsonNode verified = post("/api/documents/" + created.get("id").asLong() + "/verify", Map.of(), token(), 200);
        assertEquals("Verified", verified.get("status").asText());
    }

    @Test
    @DisplayName("account state lifecycle: suspend then reactivate")
    void accountLifecycle() throws Exception {
        JsonNode accounts = get("/api/accounts", token());
        if (accounts.size() == 0) return;
        long id = accounts.get(0).get("id").asLong();
        String original = accounts.get(0).get("status").asText();

        JsonNode suspended = post("/api/accounts/" + id + "/suspend?kind=Debit", Map.of(), token(), 200);
        assertEquals("DebitSuspension", suspended.get("status").asText());

        JsonNode reactivated = post("/api/accounts/" + id + "/reactivate", Map.of(), token(), 200);
        assertEquals("Active", reactivated.get("status").asText());

        // best-effort restore to original status label
        if (!"Active".equals(original)) {
            post("/api/accounts/" + id + "/suspend?kind=Under", Map.of(), token(), 200);
        }
    }
}
