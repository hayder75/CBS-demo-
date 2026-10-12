package com.cbs.sacco.report.web;

import com.cbs.sacco.report.model.ReportDefinition;
import com.cbs.sacco.report.model.ReportResult;
import com.cbs.sacco.report.service.ReportCatalog;
import com.cbs.sacco.report.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Catalogue + generic runner for the report framework.
 *
 * <ul>
 *   <li>{@code GET /api/reports/catalog} — categories and report definitions</li>
 *   <li>{@code GET /api/reports/run?key=...&from=&to=&office=} — run a report</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/reports")
public class ReportApiController {

    private static final Map<String, String> CATEGORY_LABELS = Map.ofEntries(
            Map.entry("financial-reports", "Financial Reports"),
            Map.entry("general-loan-reports", "General Loan Reports"),
            Map.entry("head-office-reports", "Head Office Reports"),
            Map.entry("head-office-finance", "Head Office Finance"),
            Map.entry("nbe-reports", "NBE Reports"),
            Map.entry("aml-reports", "AML Reports"),
            Map.entry("mobile-banking-reports", "Mobile Banking Reports"),
            Map.entry("transaction-report", "Transaction Reports"),
            Map.entry("customer-report", "Customer Reports"),
            Map.entry("account-report", "Account Reports"),
            Map.entry("share-report", "Share Reports"),
            Map.entry("general-report", "General Reports"));

    private final ReportService service;

    public ReportApiController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/catalog")
    public Map<String, Object> catalog() {
        List<Map<String, Object>> categories = new ArrayList<>();
        ReportCatalog.byCategory().forEach((category, defs) -> {
            List<Map<String, Object>> reports = defs.stream()
                    .filter(d -> !d.columns().isEmpty())
                    .map(ReportApiController::toCatalogEntry)
                    .toList();
            if (reports.isEmpty()) return;
            Map<String, Object> group = new LinkedHashMap<>();
            group.put("category", category);
            group.put("name", CATEGORY_LABELS.getOrDefault(category, category));
            group.put("reports", reports);
            categories.add(group);
        });
        List<ReportDefinition> all = ReportCatalog.all();
        long withColumns = all.stream().filter(d -> !d.columns().isEmpty()).count();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total", withColumns);
        out.put("categories", categories);
        return out;
    }

    @GetMapping("/run")
    public ReportResult run(@RequestParam String key, @RequestParam Map<String, String> params) {
        params.remove("key");
        return service.run(key, params);
    }

    private static Map<String, Object> toCatalogEntry(ReportDefinition d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", d.key());
        m.put("name", d.name());
        m.put("description", d.description());
        m.put("columns", d.columns());
        m.put("params", d.params());
        return m;
    }
}
