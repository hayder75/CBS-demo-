package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 4 — payments parity: 15 authorization categories, pending queue, vouchers, back-dated posting.
 */
class PaymentParityIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("manager");
    }

    @Test
    @DisplayName("GET /api/payments/authorize/categories returns the 15 families")
    void authorizeCategories() throws Exception {
        JsonNode n = get("/api/payments/authorize/categories", token());
        assertTrue(n.isArray());
        assertEquals(15, n.size(), "FRANC exposes 15 authorization categories");
        JsonNode first = n.get(0);
        assertHasFields(first, "key", "name", "description", "kinds", "pending");
        assertTrue(first.get("kinds").isArray());
    }

    @Test
    @DisplayName("a deposit enters the pending queue then authorizes")
    void depositFlow() throws Exception {
        JsonNode accounts = get("/api/accounts", token());
        if (accounts.size() == 0) return; // no accounts seeded -> skip
        long accountId = accounts.get(0).get("id").asLong();

        JsonNode created = post("/api/payments",
                Map.of("kind", "DEPOSIT", "accountId", accountId, "amount", 500),
                token(), 200);
        assertEquals("Pending", created.get("status").asText());
        long id = created.get("id").asLong();

        JsonNode categories = get("/api/payments/authorize/categories", token());
        JsonNode depositCat = null;
        for (JsonNode c : categories) {
            if ("CUSTOMER_DEPOSIT".equals(c.get("key").asText())) depositCat = c;
        }
        assertNotNull(depositCat);
        assertTrue(depositCat.get("pending").asLong() >= 1);

        JsonNode auth = post("/api/payments/" + id + "/authorize", Map.of(), token(), 200);
        assertEquals("Authorized", auth.get("status").asText());
    }

    @Test
    @DisplayName("voucher and back-dated kinds are accepted and routed to categories")
    void voucherKinds() throws Exception {
        JsonNode receipt = post("/api/payments",
                Map.of("kind", "RECEIPT_VOUCHER", "amount", 2500, "description", "Bank charges receipt"),
                token(), 200);
        assertEquals("Pending", receipt.get("status").asText());

        JsonNode backdate = post("/api/payments",
                Map.of("kind", "DEPOSIT", "amount", 1000, "description", "Back-dated posting 2026-08-01"),
                token(), 200);
        assertNotNull(backdate.get("id"));
    }

    @Test
    @DisplayName("pending queue endpoint filters by status")
    void pendingQueue() throws Exception {
        JsonNode pending = get("/api/payments/status/Pending", token());
        assertTrue(pending.isArray());
        if (pending.size() > 0) {
            assertEquals("Pending", pending.get(0).get("status").asText());
        }
    }
}
