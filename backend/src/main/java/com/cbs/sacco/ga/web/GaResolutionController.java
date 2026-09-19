package com.cbs.sacco.ga.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.ga.entity.GaResolution;
import com.cbs.sacco.ga.repo.GaResolutionRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/ga-resolutions")
public class GaResolutionController {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final GaResolutionRepository repository;
    private final MemberRepository memberRepository;

    public GaResolutionController(GaResolutionRepository repository, MemberRepository memberRepository) {
        this.repository = repository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public List<GaResolution> list() {
        return repository.findAll();
    }

    @PostMapping
    public GaResolution create(@RequestBody Map<String, Object> body) {
        Integer year = intOf(body, "year");
        BigDecimal totalSurplus = dec(body, "totalSurplus");
        BigDecimal dividendPct = dec(body, "dividendPct");
        BigDecimal reservePct = dec(body, "reservePct");

        if (year == null || year <= 0) throw new IllegalArgumentException("A valid financial year is required");
        if (totalSurplus == null || totalSurplus.signum() <= 0) {
            throw new IllegalArgumentException("Total surplus must be greater than zero");
        }
        if (dividendPct == null || dividendPct.signum() < 0 || dividendPct.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("Dividend percentage must be between 0 and 100");
        }
        if (reservePct == null || reservePct.signum() < 0 || reservePct.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("Reserve percentage must be between 0 and 100");
        }
        if (dividendPct.add(reservePct).compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("Dividend % plus reserve % cannot exceed 100%");
        }
        boolean duplicate = repository.findAll().stream()
                .anyMatch(r -> year.equals(r.getYear()) && !"Rejected".equals(r.getStatus()));
        if (duplicate) throw new IllegalArgumentException("A resolution for " + year + " already exists");

        List<Member> members = memberRepository.findAll();
        BigDecimal totalShares = members.stream()
                .map(Member::getShareBalance)
                .filter(Objects::nonNull)
                .filter(b -> b.signum() > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int eligibleMembers = (int) members.stream()
                .filter(m -> m.getShareBalance() != null && m.getShareBalance().signum() > 0)
                .count();
        long existingForYear = repository.findAll().stream()
                .filter(r -> year.equals(r.getYear()))
                .count();

        BigDecimal totalDividend = totalSurplus.multiply(dividendPct).divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal totalReserve = totalSurplus.multiply(reservePct).divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal distributable = totalDividend.add(totalReserve);
        BigDecimal dividendPerShare = totalShares.signum() > 0
                ? totalDividend.divide(totalShares, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        GaResolution resolution = new GaResolution();
        resolution.setRef(String.format("GA-%d-%d", year, existingForYear + 1));
        resolution.setYear(year);
        resolution.setTotalSurplus(totalSurplus);
        resolution.setDividendPct(dividendPct);
        resolution.setReservePct(reservePct);
        resolution.setDistributable(distributable);
        resolution.setDividendPerShare(dividendPerShare);
        resolution.setEligibleMembers(eligibleMembers);
        resolution.setTotalDividend(totalDividend);
        resolution.setTotalReserve(totalReserve);
        resolution.setStatus("Draft");
        resolution.setCreatedBy(str(body, "createdBy") != null ? str(body, "createdBy") : "Kaleab Desta");
        resolution.setCreatedAt(LocalDateTime.now());
        resolution.setNote(str(body, "note"));
        return repository.save(resolution);
    }

    @PostMapping("/{id}/approve")
    public GaResolution approve(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        GaResolution resolution = find(id);
        String approvedBy = body == null ? null : str(body, "approvedBy");
        if (approvedBy == null || approvedBy.isBlank()) approvedBy = "Tigist Fikre";
        if (!"Draft".equals(resolution.getStatus())) {
            throw new IllegalArgumentException(
                    "Only draft resolutions can be approved (current: " + resolution.getStatus() + ")");
        }
        if (approvedBy.equals(resolution.getCreatedBy())) {
            throw new IllegalArgumentException("Maker and checker must be different users");
        }
        resolution.setStatus("Approved");
        resolution.setApprovedBy(approvedBy);
        resolution.setApprovedAt(LocalDateTime.now());
        return repository.save(resolution);
    }

    @PostMapping("/{id}/reject")
    public GaResolution reject(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        GaResolution resolution = find(id);
        if (!"Draft".equals(resolution.getStatus())) {
            throw new IllegalArgumentException(
                    "Only draft resolutions can be rejected (current: " + resolution.getStatus() + ")");
        }
        resolution.setStatus("Rejected");
        String reason = body == null ? null : str(body, "reason");
        if (reason != null && !reason.isBlank()) resolution.setNote(reason);
        return repository.save(resolution);
    }

    @PostMapping("/{id}/execute")
    public GaResolution execute(@PathVariable Long id) {
        GaResolution resolution = find(id);
        if (!"Approved".equals(resolution.getStatus())) {
            throw new IllegalArgumentException(
                    "Only approved resolutions can be executed (current: " + resolution.getStatus() + ")");
        }
        resolution.setStatus("Executed");
        resolution.setExecutedAt(LocalDateTime.now());
        return repository.save(resolution);
    }

    private GaResolution find(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Resolution not found: " + id));
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer intOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static BigDecimal dec(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }
}
