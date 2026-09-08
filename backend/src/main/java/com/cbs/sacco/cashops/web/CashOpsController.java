package com.cbs.sacco.cashops.web;

import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.cashops.entity.CashMovement;
import com.cbs.sacco.cashops.entity.PettyCash;
import com.cbs.sacco.cashops.entity.Till;
import com.cbs.sacco.cashops.repo.CashMovementRepository;
import com.cbs.sacco.cashops.repo.PettyCashRepository;
import com.cbs.sacco.cashops.repo.TillRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cashops")
public class CashOpsController {

    private final TillRepository tillRepository;
    private final CashMovementRepository movementRepository;
    private final PettyCashRepository pettyCashRepository;

    public CashOpsController(TillRepository tillRepository,
                             CashMovementRepository movementRepository,
                             PettyCashRepository pettyCashRepository) {
        this.tillRepository = tillRepository;
        this.movementRepository = movementRepository;
        this.pettyCashRepository = pettyCashRepository;
    }

    @GetMapping("/tills")
    public List<Till> tills() {
        return tillRepository.findAll();
    }

    @GetMapping("/movements")
    public List<CashMovement> movements() {
        return movementRepository.findAll();
    }

    @GetMapping("/pettycash")
    public List<PettyCash> pettyCash() {
        return pettyCashRepository.findAll();
    }

    @PostMapping("/movements")
    public CashMovement createMovement(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal AppUserPrincipal principal) {
        String type = str(body, "type");
        BigDecimal amount = dec(body, "amount");
        if (type == null || type.isBlank()) throw new IllegalArgumentException("type is required");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");

        CashMovement m = new CashMovement();
        m.setDate(LocalDate.now());
        m.setType(type);
        m.setFrom(str(body, "from"));
        m.setTo(str(body, "to"));
        m.setAmount(amount);
        m.setInitiatedBy(str(body, "initiatedBy") != null ? str(body, "initiatedBy")
                : principal != null ? principal.name() : "System");
        m.setStatus("Pending");
        return movementRepository.save(m);
    }

    @PostMapping("/pettycash")
    public PettyCash createPettyCash(@RequestBody Map<String, Object> body) {
        String description = str(body, "description");
        BigDecimal amount = dec(body, "amount");
        if (description == null || description.isBlank()) throw new IllegalArgumentException("description is required");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");

        PettyCash p = new PettyCash();
        p.setDate(LocalDate.now());
        p.setDescription(description);
        p.setCategory(str(body, "category"));
        p.setAmount(amount);
        p.setReceiptNo(str(body, "receiptNo"));
        p.setStatus("Open");
        return pettyCashRepository.save(p);
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
}