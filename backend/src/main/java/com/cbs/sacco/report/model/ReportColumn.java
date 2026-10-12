package com.cbs.sacco.report.model;

/**
 * A single output column of a report. {@code type} drives frontend alignment/formatting:
 * one of STRING, NUMBER, MONEY, PERCENT, DATE.
 */
public record ReportColumn(String key, String label, String type) {
    public static ReportColumn text(String key, String label) {
        return new ReportColumn(key, label, "STRING");
    }

    public static ReportColumn num(String key, String label) {
        return new ReportColumn(key, label, "NUMBER");
    }

    public static ReportColumn money(String key, String label) {
        return new ReportColumn(key, label, "MONEY");
    }

    public static ReportColumn pct(String key, String label) {
        return new ReportColumn(key, label, "PERCENT");
    }

    public static ReportColumn date(String key, String label) {
        return new ReportColumn(key, label, "DATE");
    }
}
