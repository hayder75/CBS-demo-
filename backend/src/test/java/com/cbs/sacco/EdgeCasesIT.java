package com.cbs.sacco;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Edge cases: authentication, malformed input, unknown ids, maker-checker rules,
 * boundary values, and idempotency. Each test resets the approval rows it uses so
 * the suite is re-runnable.
 */
class EdgeCasesIT extends BaseApiIT {

    @Autowired
    private ApprovalRepository approvalRepository;

    @BeforeEach
    void resetApprovals() {
        resetApproval(2L);
        resetApproval(3L);
        resetApproval(4L);
    }

    private void resetApproval(long id) {
        Approval a = approvalRepository.findById(id).orElseThrow();
        a.setStatus("Pending");
        a.setApprovedBy(null);
        a.setDecidedAt(null);
        approvalRepository.save(a);
    }

    @Test
    @DisplayName("Protected endpoints return 401 without a token")
    void unauthenticatedIsRejected() throws Exception {
        for (String path : new String[]{"/api/members", "/api/kpi", "/api/loans", "/api/approvals",
                "/api/accounting/accounts", "/api/checkoff", "/api/cashops/tills"}) {
            int code = getStatusWithoutToken(path);
            assertEquals(401, code, path + " should be 401 without token");
        }
    }

    private int getStatusWithoutToken(String path) throws Exception {
        return mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path))
                .andReturn().getResponse().getStatus();
    }

    @Test
    @DisplayName("Malformed JWT is rejected with 401")
    void malformedTokenRejected() throws Exception {
        get("/api/members", "not-a-real-token", 401);
    }

    @Test
    @DisplayName("Unknown member id -> 404")
    void unknownMemberIs404() throws Exception {
        get("/api/members/9999", loginTokenByRole("MANAGER"), 404);
    }

    @Test
    @DisplayName("Unknown loan id -> 404")
    void unknownLoanIs404() throws Exception {
        get("/api/loans/9999", loginTokenByRole("MANAGER"), 404);
    }

    @Test
    @DisplayName("Unknown approval decision target -> 404")
    void unknownApprovalIs404() throws Exception {
        post("/api/approvals/9999/approve", Map.of(), loginTokenByRole("MANAGER"), 404);
    }

    @Test
    @DisplayName("Login with unknown username -> 404")
    void unknownUsernameIs404() throws Exception {
        post("/api/auth/login", Map.of("username", "nobody"), "", 404);
    }

    @Test
    @DisplayName("Login with unknown role -> 404")
    void unknownRoleIs404() throws Exception {
        post("/api/auth/login", Map.of("role", "NOT_A_ROLE"), "", 404);
    }

    @Test
    @DisplayName("Empty login defaults to Manager")
    void emptyLoginDefaultsToManager() throws Exception {
        JsonNode n = post("/api/auth/login", Map.of(), "", 200);
        assertEquals("MANAGER", n.get("role").asText());
    }

    @Test
    @DisplayName("Create loan: missing productId -> 400")
    void createLoanMissingProduct() throws Exception {
        post("/api/loans", Map.of("amount", 50000, "termMonths", 12), loginTokenByRole("CREDIT_OFFICER"), 400);
    }

    @Test
    @DisplayName("Create loan: invalid productId -> 404")
    void createLoanUnknownProduct() throws Exception {
        post("/api/loans", Map.of("productId", 9999, "amount", 50000, "termMonths", 12),
                loginTokenByRole("CREDIT_OFFICER"), 404);
    }

    @Test
    @DisplayName("Create loan: zero / negative / non-numeric amount -> 400")
    void createLoanBadAmount() throws Exception {
        String t = loginTokenByRole("CREDIT_OFFICER");
        post("/api/loans", Map.of("productId", 1, "amount", 0, "termMonths", 12), t, 400);
        post("/api/loans", Map.of("productId", 1, "amount", -100, "termMonths", 12), t, 400);
        post("/api/loans", Map.of("productId", 1, "amount", "abc", "termMonths", 12), t, 400);
    }

    @Test
    @DisplayName("Create loan: invalid termMonths -> 400")
    void createLoanBadTerm() throws Exception {
        String t = loginTokenByRole("CREDIT_OFFICER");
        post("/api/loans", Map.of("productId", 1, "amount", 50000, "termMonths", 0), t, 400);
        post("/api/loans", Map.of("productId", 1, "amount", 50000, "termMonths", "x"), t, 400);
    }

    @Test
    @DisplayName("Create loan: malformed JSON body -> 400 (not 500)")
    void createLoanMalformedBody() throws Exception {
        String t = loginTokenByRole("CREDIT_OFFICER");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/loans")
                        .header("Authorization", "Bearer " + t)
                        .contentType("application/json")
                        .content("{ this is not json"))
                .andReturn();
        int status = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/loans")
                        .header("Authorization", "Bearer " + t)
                        .contentType("application/json")
                        .content("{ not json"))
                .andReturn().getResponse().getStatus();
        assertEquals(400, status, "malformed JSON should be 400, got " + status);
    }

    @Test
    @DisplayName("Valid loan creation returns Pending loan with sane AI fields")
    void createLoanValid() throws Exception {
        String t = loginTokenByRole("CREDIT_OFFICER");
        JsonNode loan = post("/api/loans", Map.of("productId", 1, "amount", 25000, "termMonths", 12), t, 200);
        assertEquals("Pending", loan.get("status").asText());
        assertEquals(25000, loan.get("amount").asDouble(), 0.001);
        assertEquals(12, loan.get("termMonths").asInt());
        assertTrue(loan.get("aiScore").asInt() >= 0 && loan.get("aiScore").asInt() <= 100,
                "AI score out of range: " + loan.get("aiScore"));
        assertTrue(loan.get("aiPdPct").asDouble() >= 0 && loan.get("aiPdPct").asDouble() <= 100);
    }

    @Test
    @DisplayName("Maker-checker: initiator cannot approve or reject own request -> 409")
    void makerCheckerBlocksSelfApproval() throws Exception {
        // approval 3 initiated by Biruk Kebede (credit)
        String credit = loginTokenByRole("CREDIT_OFFICER");
        post("/api/approvals/3/approve", Map.of(), credit, 409);
        post("/api/approvals/3/reject", Map.of(), credit, 409);
    }

    @Test
    @DisplayName("Maker-checker: second decision on a decided item -> 409")
    void doubleDecisionRejected() throws Exception {
        String manager = loginTokenByRole("MANAGER");
        post("/api/approvals/3/approve", Map.of(), manager, 200);
        // second attempt by another non-initiator
        String auditor = loginTokenByRole("AUDITOR");
        post("/api/approvals/3/approve", Map.of(), auditor, 409);
    }

    @Test
    @DisplayName("Maker-checker: teller (Kaleab) may approve teller2's (Rahel) withdrawal")
    void makerCheckerCrossTeller() throws Exception {
        // approval 4 initiated by Rahel Abebe (teller2); Kaleab Desta (teller) is a different user
        String teller = loginToken("teller");
        post("/api/approvals/4/approve", Map.of(), teller, 200);
    }

    @Test
    @DisplayName("Check-off upload with no body still succeeds")
    void checkoffUploadNoBody() throws Exception {
        post("/api/checkoff/upload", Map.of(), loginTokenByRole("ACCOUNTANT"), 200);
    }

    @Test
    @DisplayName("Loan list remains valid after creating loans (idempotent contract)")
    void loansStillValidAfterCreate() throws Exception {
        String t = loginTokenByRole("MANAGER");
        JsonNode loans = get("/api/loans", t);
        assertTrue(loans.size() >= 9);
        for (JsonNode l : loans) {
            assertTrue(l.get("loanNo").asText().startsWith("LN-"), "bad loanNo: " + l.get("loanNo"));
            assertTrue(l.get("guarantors").isArray());
            assertTrue(l.get("collateralIds").isArray());
        }
    }
}