package com.cbs.sacco.loangroup.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loangroup.entity.LoanGroup;
import com.cbs.sacco.loangroup.entity.LoanGroupMember;
import com.cbs.sacco.loangroup.repo.LoanGroupMemberRepository;
import com.cbs.sacco.loangroup.repo.LoanGroupRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-groups")
public class LoanGroupController {
    private final LoanGroupRepository repo;
    private final LoanGroupMemberRepository memberRepo;
    public LoanGroupController(LoanGroupRepository repo, LoanGroupMemberRepository memberRepo) {
        this.repo = repo;
        this.memberRepo = memberRepo;
    }

    @GetMapping
    public List<LoanGroup> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public LoanGroup get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Loan group not found: " + id)); }

    @GetMapping("/{id}/members")
    public List<LoanGroupMember> members(@PathVariable Long id) { return memberRepo.findByGroupId(id); }

    @PostMapping
    public LoanGroup create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        LoanGroup g = new LoanGroup();
        g.setCode(code);
        g.setName(name);
        if (body.get("maxMembers") != null) g.setMaxMembers((int) Double.parseDouble(body.get("maxMembers").toString()));
        g.setStatus("Pending");
        return repo.save(g);
    }

    @PostMapping("/{id}/verify")
    public LoanGroup verify(@PathVariable Long id) { LoanGroup g = get(id); g.setStatus("Verified"); return repo.save(g); }

    @PostMapping("/{id}/members")
    public LoanGroupMember addMember(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        LoanGroupMember m = new LoanGroupMember();
        m.setGroupId(id);
        m.setMemberId(lng(body.get("memberId")));
        if (body.get("amount") != null) m.setAmount(new BigDecimal(body.get("amount").toString()));
        if (body.get("installments") != null) m.setInstallments((int) Double.parseDouble(body.get("installments").toString()));
        return memberRepo.save(m);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
