package com.cbs.sacco.report.service;

import com.cbs.sacco.report.model.ReportColumn;
import com.cbs.sacco.report.model.ReportDefinition;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.cbs.sacco.report.model.ReportColumn.date;
import static com.cbs.sacco.report.model.ReportColumn.money;
import static com.cbs.sacco.report.model.ReportColumn.num;
import static com.cbs.sacco.report.model.ReportColumn.pct;
import static com.cbs.sacco.report.model.ReportColumn.text;

/**
 * Registry of every report in the FRANC catalogue (12 categories, 60+ reports).
 * Definitions are static; run logic lives in {@link ReportService}.
 */
public final class ReportCatalog {

    private static final List<String> DATE_OFFICE = List.of("from", "to", "office");
    private static final List<String> DATE_ONLY = List.of("from", "to");
    private static final List<String> DATE_OFFICE_STATUS = List.of("from", "to", "office", "status");
    private static final List<String> NO_PARAMS = List.of();
    private static final List<String> AS_OF = List.of("asOf");

    private ReportCatalog() {
    }

    private static final List<ReportDefinition> DEFS = new ArrayList<>();

    private static void add(String key, String category, String name, String desc,
                            List<String> params, ReportColumn... cols) {
        DEFS.add(new ReportDefinition(key, category, name, desc, List.of(cols), params));
    }

    static {
        // ---------- Financial ----------
        add("financial-reports", "financial-reports", "Financial Reports", "Category hub", NO_PARAMS);
        add("financial-reports/trial-balance", "financial-reports", "Trial Balance",
                "Debit/credit balances by GL account", List.of("asOf", "office"),
                text("code", "Account Code"), text("name", "Account Name"),
                money("debit", "Debit"), money("credit", "Credit"),
                money("balance", "Balance"), text("side", "Side"));
        add("financial-reports/balance-sheet", "financial-reports", "Balance Sheet",
                "Assets, liabilities and equity", AS_OF,
                text("category", "Category"), text("code", "Code"), text("name", "Account Name"),
                money("amount", "Amount"));

        // ---------- General loan ----------
        add("general-loan-reports", "general-loan-reports", "General Loan Reports", "Category hub", NO_PARAMS);
        add("general-loan-reports/loan", "general-loan-reports", "Loan Report",
                "All loan accounts with status and balances", DATE_OFFICE_STATUS,
                text("loanNo", "Loan No"), text("member", "Member"),
                money("amount", "Principal"), money("balance", "Balance"),
                num("overdueDays", "Overdue Days"), text("classification", "Classification"),
                text("status", "Status"));
        add("general-loan-reports/delinquency-report", "general-loan-reports", "Delinquency Report",
                "Loans past due", DATE_OFFICE,
                text("loanNo", "Loan No"), text("member", "Member"),
                num("overdueDays", "Days Overdue"), money("balance", "Outstanding"),
                text("classification", "Classification"));
        add("general-loan-reports/loan-collection-plan", "general-loan-reports", "Loan Collection Plan",
                "Expected collections by period", DATE_OFFICE,
                text("period", "Period"), num("accounts", "Accounts"), money("expected", "Expected"));
        add("general-loan-reports/loan-loss-reserve-report", "general-loan-reports", "Loan Loss Reserve",
                "Provisioning by classification", AS_OF,
                text("classification", "Classification"), num("count", "Count"),
                money("outstanding", "Outstanding"), pct("ratePct", "Provision %"),
                money("provision", "Provision"));
        add("general-loan-reports/loan-status-report", "general-loan-reports", "Loan Status Report",
                "Counts and balances by status", DATE_OFFICE,
                text("status", "Status"), num("count", "Count"), money("balance", "Balance"));
        add("general-loan-reports/aging-report", "general-loan-reports", "Loan Aging Report",
                "Portfolio by aging bucket", AS_OF,
                text("bucket", "Bucket"), num("count", "Count"), money("balance", "Balance"));
        add("general-loan-reports/loan-book-analysis", "general-loan-reports", "Loan Book Analysis",
                "Portfolio composition", DATE_OFFICE,
                text("dimension", "Dimension"), text("value", "Value"),
                num("count", "Count"), money("amount", "Amount"));
        add("general-loan-reports/loan-collection-sheet", "general-loan-reports", "Loan Collection Sheet",
                "Collections recorded per loan", DATE_OFFICE,
                text("date", "Date"), text("loanNo", "Loan No"),
                money("principal", "Principal"), money("interest", "Interest"),
                money("total", "Total"));
        add("general-loan-reports/loan-disbursement-report", "general-loan-reports", "Loan Disbursement Report",
                "Loans disbursed in period", DATE_OFFICE,
                text("loanNo", "Loan No"), text("member", "Member"),
                money("amount", "Amount"), date("disbursedAt", "Disbursed"));
        add("general-loan-reports/par", "general-loan-reports", "Portfolio At Risk", "PAR hub", NO_PARAMS);
        add("general-loan-reports/par/dashboard", "general-loan-reports", "PAR Dashboard",
                "Portfolio at risk overview", AS_OF,
                text("bucket", "Bucket"), money("balance", "Balance"), pct("parPct", "PAR %"));
        add("general-loan-reports/par/generate", "general-loan-reports", "Generate PAR",
                "Compute PAR for a date", AS_OF,
                text("loanNo", "Loan No"), num("overdueDays", "Days"),
                money("balance", "Balance"), pct("parPct", "PAR %"));
        add("general-loan-reports/par/historical", "general-loan-reports", "Historical PAR",
                "PAR trend over dates", DATE_ONLY,
                text("date", "Date"), money("balance", "Balance"), pct("parPct", "PAR %"));
        add("general-loan-reports/par/trends", "general-loan-reports", "PAR Trends",
                "PAR movement", DATE_ONLY,
                text("period", "Period"), money("balance", "Balance"), pct("parPct", "PAR %"));

        // ---------- Head office ----------
        add("head-office-reports", "head-office-reports", "Head Office Reports", "Category hub", NO_PARAMS);
        add("head-office-reports/loan", "head-office-reports", "HO Loan Report", "Consolidated loans", DATE_OFFICE,
                text("office", "Office"), num("count", "Count"), money("balance", "Balance"));
        add("head-office-reports/aging-report", "head-office-reports", "HO Aging Report", "Aging by office", AS_OF,
                text("office", "Office"), text("bucket", "Bucket"), money("balance", "Balance"));
        add("head-office-reports/gl-reports", "head-office-reports", "HO GL Reports", "Consolidated GL", AS_OF,
                text("code", "Code"), text("name", "Account"), money("balance", "Balance"));
        add("head-office-reports/fixed-asset-management", "head-office-reports", "HO Fixed Assets",
                "Asset register and depreciation", AS_OF,
                text("code", "Code"), text("name", "Asset"), money("cost", "Cost"),
                money("accumDep", "Accum. Dep."), money("netBook", "Net Book"));
        add("head-office-reports/accounts-report", "head-office-reports", "HO Accounts Report",
                "Accounts by office/status", DATE_OFFICE,
                text("office", "Office"), num("count", "Count"), money("balance", "Balance"));
        add("head-office-reports/loan-disbursement-report", "head-office-reports", "HO Disbursement Report",
                "Disbursements by office", DATE_OFFICE,
                text("office", "Office"), num("count", "Count"), money("amount", "Amount"));
        add("head-office-reports/posting-journal", "head-office-reports", "HO Posting Journal",
                "Journal postings", DATE_OFFICE,
                date("date", "Date"), text("ref", "Ref"), text("account", "Account"),
                money("debit", "Debit"), money("credit", "Credit"));
        add("head-office-reports/customers-report", "head-office-reports", "HO Customers Report",
                "Members by office/status", DATE_OFFICE,
                text("office", "Office"), text("status", "Status"), num("count", "Count"));
        add("head-office-reports/difference-tracker-report", "head-office-reports", "Difference Tracker",
                "Balance discrepancies", DATE_OFFICE,
                text("reference", "Reference"), money("expected", "Expected"),
                money("actual", "Actual"), money("difference", "Difference"));

        // ---------- Head office finance ----------
        add("head-office-finance", "head-office-finance", "Head Office Finance", "Category hub", NO_PARAMS);
        add("head-office-finance/balance-sheet", "head-office-finance", "Consolidated Balance Sheet",
                "Balance sheet by office", AS_OF,
                text("category", "Category"), text("name", "Account"), money("amount", "Amount"));
        add("head-office-finance/cashflow", "head-office-finance", "Cash Flow", "Cash flow statement", DATE_OFFICE,
                text("section", "Section"), text("line", "Line"), money("amount", "Amount"));
        add("head-office-finance/income-statement", "head-office-finance", "Consolidated Income Statement",
                "Income and expenses", DATE_OFFICE,
                text("line", "Line"), money("amount", "Amount"));
        add("head-office-finance/daily-trial-balance", "head-office-finance", "Daily Trial Balance",
                "Trial balance for a day", List.of("asOf", "office"),
                text("code", "Code"), text("name", "Account"),
                money("debit", "Debit"), money("credit", "Credit"));
        add("head-office-finance/expense-reports", "head-office-finance", "Expense Reports",
                "Expenses by category", DATE_OFFICE,
                text("category", "Category"), money("amount", "Amount"));
        add("head-office-finance/cash-position", "head-office-finance", "Cash Position",
                "Cash and bank positions", AS_OF,
                text("account", "Account"), money("balance", "Balance"));
        add("head-office-finance/profit-loss", "head-office-finance", "Profit & Loss",
                "Profit and loss statement", DATE_OFFICE,
                text("line", "Line"), money("amount", "Amount"));

        // ---------- NBE (regulatory) ----------
        add("nbe-reports", "nbe-reports", "NBE Reports", "Regulatory reports", NO_PARAMS);
        add("nbe-reports/loan-disbursement-by-sector", "nbe-reports", "Disbursement by Sector",
                "NBE sector breakdown", DATE_ONLY,
                text("sector", "Sector"), num("count", "Count"), money("amount", "Amount"));
        add("nbe-reports/loan-distribution-by-gender", "nbe-reports", "Loan Distribution by Gender",
                "NBE gender breakdown", DATE_ONLY,
                text("gender", "Gender"), num("count", "Count"), money("amount", "Amount"));
        add("nbe-reports/balance-sheet", "nbe-reports", "NBE Balance Sheet", "Regulatory balance sheet", AS_OF,
                text("category", "Category"), text("name", "Account"), money("amount", "Amount"));
        add("nbe-reports/top-borrowing-groups", "nbe-reports", "Top Borrowing Groups",
                "Largest exposures", AS_OF,
                text("group", "Group"), num("accounts", "Accounts"), money("balance", "Balance"));
        add("nbe-reports/trial-balance", "nbe-reports", "NBE Trial Balance", "Regulatory trial balance", AS_OF,
                text("code", "Code"), text("name", "Account"),
                money("debit", "Debit"), money("credit", "Credit"));

        // ---------- AML ----------
        add("aml-reports", "aml-reports", "AML Reports", "Anti-money-laundering", NO_PARAMS);
        add("aml-reports/dashboard", "aml-reports", "AML Dashboard",
                "Alerts and case overview", DATE_OFFICE,
                text("pattern", "Pattern"), num("alerts", "Alerts"),
                num("cases", "Cases"), money("amount", "Amount"));
        add("aml-reports/case-details", "aml-reports", "AML Case Details",
                "Individual AML cases", DATE_OFFICE,
                text("caseNo", "Case No"), text("pattern", "Pattern"),
                text("member", "Member"), money("amount", "Amount"), text("status", "Status"));

        // ---------- Mobile banking ----------
        add("mobile-banking-reports", "mobile-banking-reports", "Mobile Banking Reports",
                "Mobile channel activity", DATE_OFFICE,
                text("metric", "Metric"), num("count", "Count"), money("amount", "Amount"));

        // ---------- Transaction ----------
        add("transaction-report", "transaction-report", "Transaction Reports", "Category hub", NO_PARAMS);
        add("transaction-report/deposit", "transaction-report", "Deposit Report",
                "Deposits in period", DATE_OFFICE,
                text("date", "Date"), text("member", "Member"), money("amount", "Amount"),
                text("channel", "Channel"), text("teller", "Teller"));
        add("transaction-report/withdrawal", "transaction-report", "Withdrawal Report",
                "Withdrawals in period", DATE_OFFICE,
                text("date", "Date"), text("member", "Member"), money("amount", "Amount"),
                text("channel", "Channel"), text("teller", "Teller"));
        add("transaction-report/transfer", "transaction-report", "Transfer Report",
                "Transfers in period", DATE_OFFICE,
                text("date", "Date"), text("from", "From"), text("to", "To"), money("amount", "Amount"));
        add("transaction-report/deposit-collection-sheet-customer",
                "transaction-report", "Deposit Collection Sheet",
                "Collection by customer", DATE_OFFICE,
                text("member", "Member"), num("count", "Count"), money("amount", "Amount"));
        add("transaction-report/deposit-mobilization", "transaction-report", "Deposit Mobilization",
                "Deposits by branch/teller", DATE_OFFICE,
                text("office", "Office"), text("teller", "Teller"), money("amount", "Amount"));

        // ---------- Customer ----------
        add("customer-report", "customer-report", "Customer Report",
                "Members with status and balances", DATE_OFFICE_STATUS,
                text("memberNo", "Member No"), text("name", "Full Name"), text("gender", "Gender"),
                text("phone", "Phone"), text("status", "Status"),
                money("savingsBalance", "Savings"), money("shareBalance", "Shares"));

        // ---------- Account ----------
        add("account-report", "account-report", "Account Reports", "Category hub", NO_PARAMS);
        add("account-report/time-deposit-contracts", "account-report", "Time Deposit Contracts",
                "Active term deposits", DATE_OFFICE,
                text("accountNo", "Account No"), text("member", "Member"),
                money("principal", "Principal"), pct("rate", "Rate"), date("maturity", "Maturity"));
        add("account-report/time-deposit-terminations", "account-report", "Time Deposit Terminations",
                "Terminated deposits", DATE_OFFICE,
                text("accountNo", "Account No"), date("terminated", "Terminated"), money("amount", "Amount"));
        add("account-report/time-deposit-interest", "account-report", "Time Deposit Interest",
                "Interest paid on deposits", DATE_OFFICE,
                text("accountNo", "Account No"), money("interest", "Interest"));
        add("account-report/overdraft", "account-report", "Overdraft Report",
                "Overdraft facilities", AS_OF,
                text("accountNo", "Account No"), money("limit", "Limit"), money("balance", "Balance"));
        add("account-report/overdraft-usage", "account-report", "Overdraft Usage",
                "Overdraft utilisation", AS_OF,
                text("accountNo", "Account No"), money("balance", "Balance"),
                money("limit", "Limit"), pct("usagePct", "Usage %"));

        // ---------- Share ----------
        add("share-report", "share-report", "Share Reports", "Category hub", NO_PARAMS);
        add("share-report/share-collection-sheet", "share-report", "Share Collection Sheet",
                "Share purchases by member", DATE_OFFICE,
                text("member", "Member"), num("shares", "Shares"), money("amount", "Amount"));
        add("share-report/movement", "share-report", "Share Movement",
                "Share transfers and changes", DATE_OFFICE,
                text("date", "Date"), text("member", "Member"),
                num("shares", "Shares"), money("amount", "Amount"));

        // ---------- General ----------
        add("general-report", "general-report", "General Report",
                "General ledger listings", AS_OF,
                text("code", "Code"), text("name", "Account"), money("balance", "Balance"));
    }

    public static List<ReportDefinition> all() {
        return List.copyOf(DEFS);
    }

    public static Map<String, List<ReportDefinition>> byCategory() {
        Map<String, List<ReportDefinition>> grouped = new LinkedHashMap<>();
        for (ReportDefinition d : DEFS) {
            grouped.computeIfAbsent(d.category(), k -> new ArrayList<>()).add(d);
        }
        return grouped;
    }

    public static ReportDefinition find(String key) {
        return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
    }
}
