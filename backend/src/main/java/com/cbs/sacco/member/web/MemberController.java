package com.cbs.sacco.member.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.dto.MemberDto;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;

    public MemberController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public List<MemberDto> list() {
        return memberRepository.findAll().stream().map(MemberDto::from).toList();
    }

    @GetMapping("/{id}")
    public MemberDto get(@PathVariable Long id) {
        Member member = memberRepository.findById(id).orElseThrow(
                () -> new NotFoundException("Member not found: " + id));
        return MemberDto.from(member);
    }

    @PostMapping
    public MemberDto create(@RequestBody Map<String, Object> body) {
        String fullName = str(body, "fullName");
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("fullName is required");
        }
        Member member = new Member();
        member.setMemberNo("MEM-" + String.format("%05d", memberRepository.count() + 1));
        member.setFullName(fullName);
        member.setGender("F".equalsIgnoreCase(str(body, "gender")) ? "F" : "M");
        member.setBirthDate(date(body.get("birthDate")));
        member.setPhone(str(body, "phone"));
        member.setEmail(str(body, "email"));
        member.setFaydaId(str(body, "faydaId"));
        member.setKebele(str(body, "kebele"));
        member.setWoreda(str(body, "woreda"));
        member.setCity(str(body, "city"));
        member.setOccupation(str(body, "occupation"));
        member.setEmployer(str(body, "employer"));
        member.setJoinDate(date(body.get("joinDate")));
        member.setStatus("Active");
        member.setShareBalance(BigDecimal.ZERO);
        member.setSavingsBalance(BigDecimal.ZERO);
        member.setLoanOutstanding(BigDecimal.ZERO);
        return MemberDto.from(memberRepository.save(member));
    }

    @GetMapping("/kyc")
    public List<Map<String, Object>> kyc(@RequestParam(name = "filter", defaultValue = "all") String filter) {
        return memberRepository.findAll().stream().filter(m -> switch (filter.toLowerCase()) {
            case "pending" -> "Pending".equalsIgnoreCase(m.getKycStatus()) || "KycWaiting".equalsIgnoreCase(m.getKycStatus());
            case "verified" -> "Verified".equalsIgnoreCase(m.getKycStatus());
            case "empty-photo" -> Boolean.FALSE.equals(m.getHasPhoto());
            case "without-signature" -> Boolean.FALSE.equals(m.getHasSignature());
            case "kyc-waiting" -> "KycWaiting".equalsIgnoreCase(m.getKycStatus());
            default -> true;
        }).map(m -> {
            Map<String, Object> r = new java.util.LinkedHashMap<>();
            r.put("id", m.getId());
            r.put("memberNo", m.getMemberNo());
            r.put("fullName", m.getFullName());
            r.put("gender", m.getGender());
            r.put("phone", m.getPhone());
            r.put("status", m.getStatus());
            r.put("hasPhoto", m.getHasPhoto());
            r.put("hasSignature", m.getHasSignature());
            r.put("kycStatus", m.getKycStatus());
            return r;
        }).toList();
    }

    @GetMapping("/kyc/summary")
    public Map<String, Object> kycSummary() {
        List<Member> all = memberRepository.findAll();
        long pending = all.stream().filter(m -> "Pending".equalsIgnoreCase(m.getKycStatus()) || "KycWaiting".equalsIgnoreCase(m.getKycStatus())).count();
        long verified = all.stream().filter(m -> "Verified".equalsIgnoreCase(m.getKycStatus())).count();
        long emptyPhoto = all.stream().filter(m -> Boolean.FALSE.equals(m.getHasPhoto())).count();
        long noSig = all.stream().filter(m -> Boolean.FALSE.equals(m.getHasSignature())).count();
        return Map.of("total", all.size(), "pending", pending, "verified", verified,
                "emptyPhoto", emptyPhoto, "withoutSignature", noSig);
    }

    @PostMapping("/import")
    public Map<String, Object> importMembers(@RequestBody Map<String, Object> body) {
        Object rowsObj = body.get("rows");
        if (!(rowsObj instanceof List<?> rows)) throw new IllegalArgumentException("rows must be an array");
        int created = 0;
        for (Object raw : rows) {
            if (!(raw instanceof Map<?, ?> r)) continue;
            Object name = r.get("fullName");
            if (name == null) continue;
            Member m = new Member();
            m.setMemberNo("MEM-" + String.format("%05d", memberRepository.count() + 1));
            m.setFullName(name.toString());
            m.setGender("F".equalsIgnoreCase(String.valueOf(r.get("gender"))) ? "F" : "M");
            Object phone = r.get("phone");
            if (phone != null) m.setPhone(phone.toString());
            m.setStatus("Active");
            m.setKycStatus("Pending");
            memberRepository.save(m);
            created++;
        }
        return Map.of("created", created, "total", rows.size());
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static LocalDate date(Object v) {
        if (v == null || v.toString().isBlank()) return null;
        try {
            return LocalDate.parse(v.toString());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date value: " + v);
        }
    }
}