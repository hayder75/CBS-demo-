package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 7 — products & chart of accounts parity.
 */
class ProductCoaIT extends BaseApiIT {

    private static final String SFX = Long.toString(System.currentTimeMillis() % 100000);

    private String token() throws Exception {
        return loginToken("accountant");
    }

    @Test
    @DisplayName("GET /api/product-types returns seeded types")
    void productTypes() throws Exception {
        JsonNode n = get("/api/product-types", token());
        assertTrue(n.isArray() && n.size() >= 10);
        assertHasFields(n.get(0), "id", "code", "name", "category", "status");
    }

    @Test
    @DisplayName("POST /api/product-types creates and rejects duplicates")
    void createProductType() throws Exception {
        String code = "PT_" + SFX;
        JsonNode created = post("/api/product-types",
                Map.of("code", code, "name", "Test Product", "category", "Saving"), token(), 200);
        assertEquals(code, created.get("code").asText());
        post("/api/product-types", Map.of("code", code, "name", "Dup"), token(), 400);
    }

    @Test
    @DisplayName("GET /api/coa/leaves and /hierarchical expose the ledger")
    void coaViews() throws Exception {
        JsonNode leaves = get("/api/coa/leaves", token());
        assertTrue(leaves.isArray() && leaves.size() > 0);
        assertHasFields(leaves.get(0), "code", "name", "balance");

        JsonNode hier = get("/api/coa/hierarchical", token());
        assertTrue(hier.isArray());
        if (hier.size() > 0) {
            assertHasFields(hier.get(0), "id", "name", "status", "leaves");
        }
    }

    @Test
    @DisplayName("POST /api/coa/import-gl-balance updates balances")
    void importGlBalance() throws Exception {
        JsonNode leaves = get("/api/coa/leaves", token());
        JsonNode first = leaves.get(0);
        String code = first.get("code").asText();
        String original = first.get("balance").asText();

        JsonNode res = post("/api/coa/import-gl-balance",
                Map.of("rows", List.of(Map.of("code", code, "balance", original))), token(), 200);
        assertEquals(1, res.get("updated").asInt());

        post("/api/coa/import-gl-balance",
                Map.of("rows", List.of(Map.of("code", "NO_SUCH", "balance", 1))), token(), 404);
    }
}
