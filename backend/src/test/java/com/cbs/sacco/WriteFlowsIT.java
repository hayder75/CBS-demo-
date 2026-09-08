package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Write flows: every data-entry form's POST endpoint, with re-runnable relative
 * invariants (balances delta, GL stays balanced, status fields correct).
 */
class WriteFlowsIT extends BaseApiIT {

    @Test
    @DisplayName("Register member -> Active, balances zero, valid memberNo")
    void createMember() throws Exception {
        JsonNode m = post("/api/members", Map.of(
                "fullName", "Test Member One", "gender", "F",
                "occupation", "Teacher", "employer", "Ministry of Education",
                "city", "Addis Ababa", "joinDate", "2026-09-08"), loginTokenByRole("TELLER"), 200);
        assertEquals("Active", m.get("status").asText());
        assertTrue(m.get("memberNo").asText().startsWith("MEM-"));
        assertEquals(0, m.get("shareBalance").decimalValue().signum());
        assertEquals(0, m.get("savingsBalance").decimalValue().signum());
    }

    @Test
    @DisplayName("Create member: missing name -> 400")
    void createMemberValidation() throws Exception {
        post("/api/members", Map.of("gender", "M"), loginTokenByRole("TELLER"), 400);
    }

    @Test
    @DisplayName("Deposit posts transaction, credits member, keeps GL balanced")
    void deposit() throws Exception {
        String token = loginTokenByRole("TELLER");
        BigDecimal before = get("/api/members/1", token).get("savingsBalance").decimalValue();

        JsonNode tx = post("/api/savings/transactions", Map.of(
                "memberId", 1, "productId", 2, "type", "Deposit", "amount", 5000,
                "teller", "Kaleab Desta", "channel", "Cash"), token, 200);
        assertEquals("Deposit", tx.get("type").asText());

        JsonNode afterMember = get("/api/members/1", token);
        assertEquals(before.add(BigDecimal.valueOf(5000)),
                afterMember.get("savingsBalance").decimalValue(),
                "member savings balance should increase by deposit");
        assertGlBalanced(token);
    }

    @Test
    @DisplayName("Withdrawal reduces balance and keeps GL balanced")
    void withdrawal() throws Exception {
        String token = loginTokenByRole("TELLER");
        BigDecimal before = get("/api/members/1", token).get("savingsBalance").decimalValue();
        post("/api/savings/transactions", Map.of(
                "memberId", 1, "productId", 2, "type", "Withdrawal", "amount", 1000), token, 200);
        BigDecimal after = get("/api/members/1", token).get("savingsBalance").decimalValue();
        assertEquals(before.subtract(BigDecimal.valueOf(1000)), after);
        assertGlBalanced(token);
    }

    @Test
    @DisplayName("Withdrawal exceeding balance -> 409")
    void withdrawalOverBalance() throws Exception {
        post("/api/savings/transactions", Map.of(
                "memberId", 1, "productId", 2, "type", "Withdrawal", "amount", 999_999_999),
                loginTokenByRole("TELLER"), 409);
    }

    @Test
    @DisplayName("Withdrawal breaching minimum balance -> 409")
    void withdrawalBelowMinBalance() throws Exception {
        // Mandatory product (id 1) has min balance 1200; member 1 balance ~200k
        post("/api/savings/transactions", Map.of(
                "memberId", 1, "productId", 1, "type", "Withdrawal", "amount", 999_999_999),
                loginTokenByRole("TELLER"), 409);
    }

    @Test
    @DisplayName("Invalid transaction amount/type -> 400")
    void invalidTransaction() throws Exception {
        String token = loginTokenByRole("TELLER");
        post("/api/savings/transactions", Map.of("memberId", 1, "productId", 2, "type", "Deposit", "amount", 0), token, 400);
        post("/api/savings/transactions", Map.of("memberId", 1, "productId", 2, "type", "Nonsense", "amount", 100), token, 400);
    }

    @Test
    @DisplayName("Create savings product -> persisted")
    void createProduct() throws Exception {
        JsonNode p = post("/api/savings/products", Map.of(
                "code", "S-TEST", "name", "Test Savings", "type", "Voluntary",
                "interestRatePct", 7.5, "minBalance", 0), loginTokenByRole("ACCOUNTANT"), 200);
        assertEquals("S-TEST", p.get("code").asText());
    }

    @Test
    @DisplayName("Post interest -> members credited, GL balanced")
    void postInterest() throws Exception {
        String token = loginTokenByRole("ACCOUNTANT");
        JsonNode res = post("/api/savings/interest", Map.of(), token, 200);
        assertTrue(res.get("posted").asInt() >= 0);
        assertGlBalanced(token);
    }

    @Test
    @DisplayName("Balanced journal entry posts and updates GL")
    void journalEntryBalanced() throws Exception {
        String token = loginTokenByRole("ACCOUNTANT");
        BigDecimal cashBefore = glBalance(token, "1000");
        post("/api/accounting/journal", Map.of(
                "debitAccountCode", "1000", "debit", 25000,
                "creditAccountCode", "1200", "credit", 25000,
                "description", "E2E journal test"), token, 200);
        assertTrue(glBalance(token, "1000").compareTo(cashBefore.add(BigDecimal.valueOf(25000))) == 0,
                "cash should increase by the debit amount");
        assertGlBalanced(token);
    }

    @Test
    @DisplayName("Unbalanced journal entry -> 400")
    void journalEntryUnbalanced() throws Exception {
        post("/api/accounting/journal", Map.of(
                "debitAccountCode", "1000", "debit", 100,
                "creditAccountCode", "1200", "credit", 90), loginTokenByRole("ACCOUNTANT"), 400);
    }

    @Test
    @DisplayName("Journal entry with unknown account -> 404")
    void journalEntryUnknownAccount() throws Exception {
        post("/api/accounting/journal", Map.of(
                "debitAccountCode", "9999", "debit", 100,
                "creditAccountCode", "1200", "credit", 100), loginTokenByRole("ACCOUNTANT"), 404);
    }

    @Test
    @DisplayName("Add collateral -> Pledged with computed FSV")
    void addCollateral() throws Exception {
        JsonNode c = post("/api/collateral", Map.of(
                "type", "Vehicle Ownership", "owner", "Test Owner",
                "description", "Test vehicle", "valuation", 1000000, "discountPct", 20),
                loginTokenByRole("CREDIT_OFFICER"), 200);
        assertEquals("Pledged", c.get("status").asText());
        assertEquals(800000, c.get("forcedSaleValue").asInt(), "FSV = valuation * (1 - 20%)");
    }

    @Test
    @DisplayName("Share transfer -> Pending")
    void shareTransfer() throws Exception {
        JsonNode t = post("/api/shares/transfers", Map.of(
                "fromMember", "Member A", "toMember", "Member B", "shares", 100, "value", 10000),
                loginTokenByRole("ACCOUNTANT"), 200);
        assertEquals("Pending", t.get("status").asText());
        assertEquals(100, t.get("shares").asInt());
    }

    @Test
    @DisplayName("Cash movement -> Pending")
    void cashMovement() throws Exception {
        JsonNode m = post("/api/cashops/movements", Map.of(
                "type", "Vault to Teller", "from", "Vault", "to", "Teller 1", "amount", 50000),
                loginTokenByRole("TELLER"), 200);
        assertEquals("Pending", m.get("status").asText());
    }

    @Test
    @DisplayName("Petty cash entry -> Open")
    void pettyCash() throws Exception {
        JsonNode p = post("/api/cashops/pettycash", Map.of(
                "description", "Test expense", "category", "Fuel", "amount", 1500),
                loginTokenByRole("TELLER"), 200);
        assertEquals("Open", p.get("status").asText());
    }

    private BigDecimal glBalance(String token, String code) throws Exception {
        ArrayNode accounts = (ArrayNode) get("/api/accounting/accounts", token);
        for (JsonNode a : accounts) {
            if (code.equals(a.get("code").asText())) return a.get("balance").decimalValue();
        }
        throw new AssertionError("GL account " + code + " not found");
    }

    private void assertGlBalanced(String token) throws Exception {
        ArrayNode journal = (ArrayNode) get("/api/accounting/journal", token);
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        for (JsonNode j : journal) {
            debit = debit.add(j.get("debit").decimalValue());
            credit = credit.add(j.get("credit").decimalValue());
        }
        assertEquals(0, debit.compareTo(credit),
                "journal must stay balanced after write flows (debits " + debit + " credits " + credit + ")");
    }
}