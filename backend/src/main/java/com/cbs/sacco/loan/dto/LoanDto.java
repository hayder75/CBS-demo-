package com.cbs.sacco.loan.dto;

import com.cbs.sacco.loan.entity.Guarantor;
import com.cbs.sacco.loan.entity.Loan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record LoanDto(
        Long id,
        String loanNo,
        Long memberId,
        String memberName,
        Long productId,
        String productName,
        String status,
        BigDecimal amount,
        LocalDate disbursedAt,
        Integer termMonths,
        BigDecimal ratePct,
        String scheduleType,
        BigDecimal principalPaid,
        BigDecimal interestPaid,
        BigDecimal balance,
        Integer overdueDays,
        String classification,
        List<GuarantorDto> guarantors,
        List<Long> collateralIds,
        Integer aiScore,
        BigDecimal aiPdPct,
        String aiGuidance,
        LocalDate nextDueDate) {

    public record GuarantorDto(Long memberId, String name, BigDecimal exposure,
                               BigDecimal pledgedDeposit, String status) {
        static GuarantorDto of(Guarantor g) {
            return new GuarantorDto(g.getMemberId(), g.getName(), g.getExposure(),
                    g.getPledgedDeposit(), g.getStatus());
        }
    }

    public static LoanDto from(Loan l, List<Long> collateralIds, String memberName) {
        return new LoanDto(
                l.getId(),
                l.getLoanNo(),
                l.getMemberId(),
                memberName,
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getStatus(),
                l.getAmount(),
                l.getDisbursedAt(),
                l.getTermMonths(),
                l.getRatePct(),
                l.getScheduleType(),
                l.getPrincipalPaid(),
                l.getInterestPaid(),
                l.getBalance(),
                l.getOverdueDays(),
                l.getClassification(),
                l.getGuarantors().stream().map(GuarantorDto::of).toList(),
                collateralIds,
                l.getAiScore(),
                l.getAiPdPct(),
                l.getAiGuidance(),
                l.getNextDueDate());
    }
}