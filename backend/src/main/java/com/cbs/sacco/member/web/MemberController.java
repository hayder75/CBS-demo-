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