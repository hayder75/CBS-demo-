package com.cbs.sacco.report.model;

import java.util.List;
import java.util.Map;

/**
 * Result of running a report: columns + rows + totals, plus echoed params and a timestamp.
 */
public record ReportResult(
        String key,
        String name,
        List<ReportColumn> columns,
        List<Map<String, Object>> rows,
        int total,
        String generatedAt,
        Map<String, Object> params,
        Map<String, Object> summary) {
}
