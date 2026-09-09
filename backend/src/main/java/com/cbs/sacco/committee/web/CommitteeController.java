package com.cbs.sacco.committee.web;

import com.cbs.sacco.committee.entity.CommitteeMember;
import com.cbs.sacco.committee.entity.CreditCommittee;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.committee.repo.CommitteeMemberRepository;
import com.cbs.sacco.committee.repo.CreditCommitteeRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/committees")
public class CommitteeController {
    private final CreditCommitteeRepository repo;
    private final CommitteeMemberRepository memberRepo;
    public CommitteeController(CreditCommitteeRepository repo, CommitteeMemberRepository memberRepo) {
        this.repo = repo;
        this.memberRepo = memberRepo;
    }

    @GetMapping
    public List<CreditCommittee> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public CreditCommittee get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Committee not found: " + id)); }

    @GetMapping("/{id}/members")
    public List<CommitteeMember> members(@PathVariable Long id) { return memberRepo.findByCommitteeId(id); }

    @PostMapping
    public CreditCommittee create(@RequestBody Map<String, Object> body) {
        String name = str(body, "name");
        if (name == null) throw new IllegalArgumentException("name is required");
        CreditCommittee c = new CreditCommittee();
        c.setName(name);
        if (body.get("minAmount") != null) c.setMinAmount(new BigDecimal(body.get("minAmount").toString()));
        if (body.get("maxAmount") != null) c.setMaxAmount(new BigDecimal(body.get("maxAmount").toString()));
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public CreditCommittee verify(@PathVariable Long id) { CreditCommittee c = get(id); c.setStatus("Verified"); return repo.save(c); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
