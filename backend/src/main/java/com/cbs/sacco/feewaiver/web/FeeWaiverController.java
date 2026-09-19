package com.cbs.sacco.feewaiver.web;

import com.cbs.sacco.charge.entity.Charge;
import com.cbs.sacco.charge.repo.ChargeRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.feewaiver.entity.FeeWaiver;
import com.cbs.sacco.feewaiver.repo.FeeWaiverRepository;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fee-waivers")
public class FeeWaiverController {

    private static final String DEFAULT_USER = "Tigist Fikre";

    private final FeeWaiverRepository repository;
    private final MemberRepository memberRepository;
    private final ChargeRepository chargeRepository;

    public FeeWaiverController(
            FeeWaiverRepository repository,
            MemberRepository memberRepository,
            ChargeRepository chargeRepository) {
        this.repository = repository;
        this.memberRepository = memberRepository;
        this.chargeRepository = chargeRepository;
    }

    @GetMapping
    public List<FeeWaiver> list() {
        return repository.findAll();
    }

    @PostMapping
    public FeeWaiver create(@RequestBody Map<String, Object> body) {
        BigDecimal amount = dec(body, "amount");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        LocalDate dateFrom = date(body, "dateFrom");
        LocalDate dateTo = date(body, "dateTo");
        if (dateFrom == null || dateTo == null || dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("dateFrom must be on or before dateTo");
        }

        String reason = str(body, "reason");
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reason is required");
        }

        Long memberId = longOf(body, "memberId");
        Member member = memberId == null ? null : memberRepository.findById(memberId).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("Member not found: " + memberId);
        }

        String chargeCode = str(body, "chargeCode");
        Charge charge = chargeCode == null ? null : chargeRepository.findAll().stream()
                .filter(c -> chargeCode.equals(c.getCode()))
                .findFirst()
                .orElse(null);
        if (charge == null) {
            throw new IllegalArgumentException("Charge not found: " + chargeCode);
        }

        FeeWaiver waiver = new FeeWaiver();
        waiver.setMemberId(member.getId());
        waiver.setMemberName(member.getFullName());
        waiver.setChargeCode(charge.getCode());
        waiver.setChargeName(charge.getName());
        waiver.setDateFrom(dateFrom);
        waiver.setDateTo(dateTo);
        waiver.setAmount(amount);
        waiver.setReason(reason.trim());
        waiver.setStatus("Pending");
        String requestedBy = str(body, "requestedBy");
        waiver.setRequestedBy(requestedBy == null || requestedBy.isBlank() ? DEFAULT_USER : requestedBy);
        waiver.setRequestedAt(LocalDateTime.now());
        return repository.save(waiver);
    }

    @PostMapping("/{id}/approve")
    public FeeWaiver approve(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        FeeWaiver waiver = find(id);
        String approvedBy = body == null ? null : str(body, "approvedBy");
        if (approvedBy == null || approvedBy.isBlank()) approvedBy = DEFAULT_USER;
        if (!"Pending".equals(waiver.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending waivers can be approved (current: " + waiver.getStatus() + ")");
        }
        if (approvedBy.equals(waiver.getRequestedBy())) {
            throw new IllegalArgumentException("Maker and checker must be different users");
        }
        waiver.setStatus("Approved");
        waiver.setApprovedBy(approvedBy);
        waiver.setDecidedAt(LocalDateTime.now());
        return repository.save(waiver);
    }

    @PostMapping("/{id}/reject")
    public FeeWaiver reject(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        FeeWaiver waiver = find(id);
        if (!"Pending".equals(waiver.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending waivers can be rejected (current: " + waiver.getStatus() + ")");
        }
        waiver.setStatus("Rejected");
        waiver.setDecidedAt(LocalDateTime.now());
        return repository.save(waiver);
    }

    private FeeWaiver find(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Fee waiver not found: " + id));
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
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

    private static Long longOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static LocalDate date(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return LocalDate.parse(v.toString());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(key + " must be a valid date (YYYY-MM-DD)");
        }
    }
}
