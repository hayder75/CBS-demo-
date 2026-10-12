package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AI-assisted loan scoring: policy, features, scoring, preview, override.
 */
class LoanScoringIT extends BaseApiIT {

    private String token() throws Exception {
        return loginToken("credit");
    }

    @Test
    @DisplayName("GET /api/loan-scoring/policy returns policy, factors and bands")
    void policy() throws Exception {
        JsonNode n = get("/api/loan-scoring/policy", token());
        assertHasFields(n, "policy", "factors", "bands", "versions");
        assertTrue(n.get("factors").size() >= 8, "expected 8 scoring factors");
        assertTrue(n.get("bands").size() >= 5, "expected 5 grade bands");
        assertHasFields(n.get("policy"), "id", "version", "active", "minScoreAutoApprove", "minScoreRefer");
        assertHasFields(n.get("factors").get(0), "code", "name", "weight", "direction");
    }

    @Test
    @DisplayName("scoring a member produces score, grade, decision, narration and factors")
    void scoreMember() throws Exception {
        JsonNode members = get("/api/members", token());
        assertTrue(members.size() > 0);
        long memberId = members.get(0).get("id").asLong();

        JsonNode n = post("/api/loan-scoring/preview", Map.of("memberId", memberId), token(), 200);
        assertHasFields(n, "score", "grade", "pdPct", "decision", "recommendedAmount", "recommendedTerm", "narration", "factors", "features");
        double score = n.get("score").asDouble();
        assertTrue(score >= 0 && score <= 100, "score in range");
        assertTrue(List.of("AUTO_APPROVE", "REFER", "DECLINE").contains(n.get("decision").asText()));
        assertTrue(n.get("factors").size() >= 8);
        assertFalse(n.get("narration").asText().isBlank());
    }

    @Test
    @DisplayName("preview works with manual feature values (sandbox)")
    void previewSandbox() throws Exception {
        JsonNode n = post("/api/loan-scoring/preview",
                Map.of("savingsAvgBalance", 200000, "depositFreqMonthly", 8, "shareBalance", 60000,
                        "onTimePct", 100, "arrearsDays", 0, "dtiPct", 20, "tenureMonths", 48,
                        "collateralCoveragePct", 80, "kycComplete", true),
                token(), 200);
        assertHasFields(n, "score", "grade", "decision");
        assertTrue(n.get("score").asDouble() > 50, "strong profile should score well");
    }

    @Test
    @DisplayName("features endpoint returns a computed snapshot")
    void features() throws Exception {
        JsonNode members = get("/api/members", token());
        long memberId = members.get(0).get("id").asLong();
        JsonNode n = get("/api/loan-scoring/features/" + memberId, token());
        assertHasFields(n, "memberId", "savingsAvgBalance", "depositFreqMonthly", "shareBalance",
                "onTimePct", "arrearsDays", "dtiPct", "tenureMonths", "kycComplete");
    }

    @Test
    @DisplayName("factor weights can be updated")
    void updateFactor() throws Exception {
        JsonNode policy = get("/api/loan-scoring/policy", token());
        JsonNode factor = policy.get("factors").get(0);
        long id = factor.get("id").asLong();
        double original = factor.get("weight").asDouble();

        JsonNode updated = put("/api/loan-scoring/factors/" + id, Map.of("weight", 2.0), token(), 200);
        assertEquals(2.0, updated.get("weight").asDouble(), 0.001);

        put("/api/loan-scoring/factors/" + id, Map.of("weight", original), token(), 200);
    }

    @Test
    @DisplayName("recompute builds snapshots for all members")
    void recompute() throws Exception {
        JsonNode n = post("/api/loan-scoring/recompute", Map.of(), token(), 200);
        assertHasFields(n, "recomputed");
        assertTrue(n.get("recomputed").asInt() > 0);
    }

    @Test
    @DisplayName("loan scoring + officer override")
    void scoreLoanAndOverride() throws Exception {
        JsonNode loans = get("/api/loans", token());
        if (loans.size() == 0) return;
        long loanId = loans.get(0).get("id").asLong();
        JsonNode scored = get("/api/loan-scoring/loan/" + loanId, token());
        assertHasFields(scored, "scoreRunId", "score", "decision");
        long runId = scored.get("scoreRunId").asLong();

        JsonNode over = post("/api/loan-scoring/runs/" + runId + "/override",
                Map.of("decision", "APPROVE", "reason", "Strong relationship, approved by committee"), token(), 200);
        assertEquals("APPROVE", over.get("overrideDecision").asText());
    }
}
