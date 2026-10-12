package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 6 — loan parity: configuration parameters and repayment prediction.
 */
class LoanParityIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("credit");
    }

    @Test
    @DisplayName("GET /api/loan-config returns seeded parameters")
    void loanConfigList() throws Exception {
        JsonNode n = get("/api/loan-config", token());
        assertTrue(n.isArray() && n.size() >= 10);
        assertHasFields(n.get(0), "id", "configKey", "configValue", "valueType", "configGroup");
    }

    @Test
    @DisplayName("PUT /api/loan-config/{key} updates a value")
    void loanConfigUpdate() throws Exception {
        JsonNode updated = put("/api/loan-config/default_interest_rate_pct",
                Map.of("configValue", "15.5"), token(), 200);
        assertEquals("15.5", updated.get("configValue").asText());
        // restore
        put("/api/loan-config/default_interest_rate_pct", Map.of("configValue", "14"), token(), 200);

        put("/api/loan-config/NO_SUCH_KEY", Map.of("configValue", "1"), token(), 404);
    }

    @Test
    @DisplayName("GET /api/loans/repayment-prediction returns AI risk view")
    void repaymentPrediction() throws Exception {
        JsonNode n = get("/api/loans/repayment-prediction", token());
        assertTrue(n.isArray());
        if (n.size() > 0) {
            assertHasFields(n.get(0), "loanNo", "balance", "overdueDays", "aiScore", "aiPdPct", "guidance");
        }
    }

    @Test
    @DisplayName("GET /api/loans/products returns loan products")
    void loanProducts() throws Exception {
        JsonNode n = get("/api/loans/products", token());
        assertTrue(n.isArray());
    }
}
