package com.cbs.sacco.report.model;

import java.util.List;

/**
 * Metadata for a report exposed by {@code GET /api/reports/catalog}.
 *
 * @param key         stable id, equals the FRANC route without the {@code reports/} prefix
 * @param category    top-level group (financial-reports, general-loan-reports, ...)
 * @param name        human title
 * @param description short purpose
 * @param columns     output columns
 * @param params      supported filter keys (subset of from,to,office,status,product,memberId)
 */
public record ReportDefinition(
        String key,
        String category,
        String name,
        String description,
        List<ReportColumn> columns,
        List<String> params) {
}
