package com.cbs.sacco.paymentmode.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.paymentmode.entity.PaymentMode;
import com.cbs.sacco.paymentmode.repo.PaymentModeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-modes")
public class PaymentModeController {
    private final PaymentModeRepository repo;
    public PaymentModeController(PaymentModeRepository repo) { this.repo = repo; }

    @GetMapping
    public List<PaymentMode> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public PaymentMode get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Payment mode not found: " + id)); }

    @PostMapping
    public PaymentMode create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        PaymentMode m = new PaymentMode();
        m.setCode(code);
        m.setName(name);
        m.setPaymentType(str(body, "paymentType") != null ? str(body, "paymentType") : "CASH");
        m.setDescription(str(body, "description"));
        m.setStatus("Pending");
        return repo.save(m);
    }

    @PutMapping("/{id}")
    public PaymentMode update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        PaymentMode m = get(id);
        if (body.containsKey("name")) m.setName(str(body, "name"));
        if (body.containsKey("paymentType")) m.setPaymentType(str(body, "paymentType"));
        if (body.containsKey("status")) m.setStatus(str(body, "status"));
        return repo.save(m);
    }

    @PostMapping("/{id}/verify")
    public PaymentMode verify(@PathVariable Long id) { PaymentMode m = get(id); m.setStatus("Verified"); return repo.save(m); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
