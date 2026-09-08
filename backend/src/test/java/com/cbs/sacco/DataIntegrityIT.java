package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Financial integrity: double-entry journals must balance, the balance sheet must
 * balance, and dashboard KPIs must be consistent with the underlying records.
 */
class DataIntegrityIT extends BaseApiIT {

    @Test
    @DisplayName("Journal: total debits equal total credits (double-entry)")
    void journalBalances() throws Exception {
        String t = loginTokenByRole("ACCOUNTANT");
        ArrayNode journal = (ArrayNode) get("/api/accounting/journal", t);
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        for (JsonNode j : journal) {
            debit = debit.add(j.get("debit").decimalValue());
            credit = credit.add(j.get("credit").decimalValue());
        }
        assertTrue(journal.size() >= 5, "expected seeded journal entries");
        assertEquals(0, debit.compareTo(credit),
                "debits " + debit + " must equal credits " + credit);
    }

    @Test
    @DisplayName("Balance sheet: assets = liabilities + equity + current surplus")
    void balanceSheetBalances() throws Exception {
        String t = loginTokenByRole("ACCOUNTANT");
        ArrayNode accounts = (ArrayNode) get("/api/accounting/accounts", t);
        BigDecimal assets = BigDecimal.ZERO;
        BigDecimal liabEquity = BigDecimal.ZERO;
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        for (JsonNode a : accounts) {
            String cat = a.get("category").asText();
            BigDecimal bal = a.get("balance").decimalValue();
            if ("Asset".equals(cat)) assets = assets.add(bal);
            else if ("Liability".equals(cat) || "Equity".equals(cat)) liabEquity = liabEquity.add(bal.abs());
            else if ("Income".equals(cat)) income = income.add(bal.abs());
            else if ("Expense".equals(cat)) expense = expense.add(bal.abs());
        }
        BigDecimal rightSide = liabEquity.add(income.subtract(expense));
        assertTrue(assets.signum() > 0, "assets should be positive");
        assertEquals(0, assets.compareTo(rightSide),
                "assets " + assets + " must equal liabilities+equity+surplus " + rightSide);
    }

    @Test
    @DisplayName("KPI consistency: loanPortfolio = sum of loan balances")
    void kpiMatchesLoanPortfolio() throws Exception {
        String t = loginTokenByRole("MANAGER");
        ArrayNode loans = (ArrayNode) get("/api/loans", t);
        JsonNode kpi = get("/api/kpi", t);
        BigDecimal sumBalances = BigDecimal.ZERO;
        for (JsonNode l : loans) sumBalances = sumBalances.add(l.get("balance").decimalValue());
        assertEquals(0, sumBalances.compareTo(kpi.get("loanPortfolio").decimalValue()),
                "loanPortfolio " + kpi.get("loanPortfolio") + " != sum " + sumBalances);
    }

    @Test
    @DisplayName("KPI consistency: totalMembers and activeMembers match member registry")
    void kpiMatchesMembers() throws Exception {
        String t = loginTokenByRole("MANAGER");
        ArrayNode members = (ArrayNode) get("/api/members", t);
        JsonNode kpi = get("/api/kpi", t);
        assertEquals(members.size(), kpi.get("totalMembers").asInt());
        long active = 0;
        for (JsonNode m : members) if ("Active".equals(m.get("status").asText())) active++;
        assertEquals(active, kpi.get("activeMembers").asInt());
    }

    @Test
    @DisplayName("Loan portfolio: classifications sum to 100%")
    void portfolioAtRiskSumsTo100() throws Exception {
        String t = loginTokenByRole("MANAGER");
        ArrayNode par = (ArrayNode) get("/api/portfolio-at-risk", t);
        BigDecimal sum = BigDecimal.ZERO;
        for (JsonNode row : par) sum = sum.add(row.get("value").decimalValue());
        assertTrue(sum.compareTo(new BigDecimal("99")) >= 0 && sum.compareTo(new BigDecimal("101")) <= 0,
                "PAR proportions should sum to ~100%, got " + sum);
    }

    @Test
    @DisplayName("Each member statement is retrievable and internally consistent")
    void memberStatements() throws Exception {
        String t = loginTokenByRole("ACCOUNTANT");
        ArrayNode members = (ArrayNode) get("/api/members", t);
        for (JsonNode m : members) {
            long id = m.get("id").asLong();
            ArrayNode stmt = (ArrayNode) get("/api/savings/transactions/" + id, t);
            for (JsonNode tx : stmt) {
                assertEquals(id, tx.get("memberId").asLong(),
                        "statement must only contain the member's own transactions");
                assertTrue(tx.get("amount").decimalValue().signum() != 0);
            }
        }
    }
}