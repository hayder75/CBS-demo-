package com.cbs.sacco.dashboard.dto;

import java.math.BigDecimal;

public record KpiDto(
        long totalMembers,
        long activeMembers,
        long newMembersThisMonth,
        BigDecimal totalSavings,
        BigDecimal totalDepositsThisMonth,
        BigDecimal loanPortfolio,
        BigDecimal loanDisbursedThisMonth,
        long overdueLoans,
        BigDecimal parPct,
        BigDecimal cashOnHand,
        BigDecimal cashAtBank,
        BigDecimal incomeThisMonth,
        BigDecimal expenseThisMonth,
        BigDecimal surplusThisMonth,
        BigDecimal membersGrowthPct,
        BigDecimal savingsGrowthPct,
        BigDecimal dividendPerShare,
        long approvalsPending) {}