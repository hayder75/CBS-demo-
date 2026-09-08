package com.cbs.sacco.member.dto;

import com.cbs.sacco.member.entity.Member;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MemberDto(
        Long id,
        String memberNo,
        String fullName,
        String gender,
        LocalDate birthDate,
        String phone,
        String email,
        String faydaId,
        String kebele,
        String woreda,
        String city,
        String occupation,
        String employer,
        String status,
        LocalDate joinDate,
        String photoColor,
        BigDecimal shareBalance,
        BigDecimal savingsBalance,
        BigDecimal loanOutstanding,
        List<NokDto> nextOfKin,
        List<BeneficiaryDto> beneficiaries) {

    public record NokDto(String name, String relation, String phone) {
        static NokDto of(com.cbs.sacco.member.entity.NextOfKin n) {
            return new NokDto(n.getFullName(), n.getRelation(), n.getPhone());
        }
    }

    public record BeneficiaryDto(String name, String relation, String phone, BigDecimal percent) {
        static BeneficiaryDto of(com.cbs.sacco.member.entity.Beneficiary b) {
            return new BeneficiaryDto(b.getFullName(), b.getRelation(), b.getPhone(), b.getPercent());
        }
    }

    public static MemberDto from(Member m) {
        return new MemberDto(
                m.getId(),
                m.getMemberNo(),
                m.getFullName(),
                m.getGender(),
                m.getBirthDate(),
                m.getPhone(),
                m.getEmail(),
                m.getFaydaId(),
                m.getKebele(),
                m.getWoreda(),
                m.getCity(),
                m.getOccupation(),
                m.getEmployer(),
                m.getStatus(),
                m.getJoinDate(),
                photoColor(m.getId()),
                m.getShareBalance(),
                m.getSavingsBalance(),
                m.getLoanOutstanding(),
                m.getNextOfKin().stream().map(NokDto::of).toList(),
                m.getBeneficiaries().stream().map(BeneficiaryDto::of).toList());
    }

    private static String photoColor(Long id) {
        int h = (int) ((id * 137L) % 360L);
        return String.format("hsl(%d, 55%%, 45%%)", h);
    }
}