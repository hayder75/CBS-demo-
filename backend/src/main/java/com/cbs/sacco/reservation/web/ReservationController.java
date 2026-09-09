package com.cbs.sacco.reservation.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.reservation.entity.FundReservation;
import com.cbs.sacco.reservation.repo.FundReservationRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final FundReservationRepository repo;
    public ReservationController(FundReservationRepository repo) { this.repo = repo; }

    @GetMapping
    public List<FundReservation> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public FundReservation get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Reservation not found: " + id)); }

    @PostMapping
    public FundReservation create(@RequestBody Map<String, Object> body) {
        Long accountId = lng(body.get("accountId"));
        Long memberId = lng(body.get("memberId"));
        BigDecimal amount = body.get("amount") != null ? new BigDecimal(body.get("amount").toString()) : null;
        if (accountId == null || memberId == null || amount == null)
            throw new IllegalArgumentException("accountId, memberId and amount are required");
        if (amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");
        FundReservation r = new FundReservation();
        r.setAccountId(accountId);
        r.setMemberId(memberId);
        r.setAmount(amount);
        r.setReason(str(body, "reason"));
        r.setReservedBy(str(body, "reservedBy"));
        r.setStatus("Active");
        return repo.save(r);
    }

    @PostMapping("/{id}/release")
    public FundReservation release(@PathVariable Long id) {
        FundReservation r = get(id);
        r.setStatus("Released");
        return repo.save(r);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
