package com.cbs.sacco.payment.web;

import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.payment.entity.Payment;
import com.cbs.sacco.payment.service.PaymentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) { this.service = service; }

    @GetMapping
    public List<Payment> list() { return service.list(); }

    @GetMapping("/status/{status}")
    public List<Payment> byStatus(@PathVariable String status) { return service.byStatus(status); }

    @GetMapping("/kind/{kind}")
    public List<Payment> byKind(@PathVariable String kind) { return service.byKind(kind); }

    @PostMapping
    public Payment create(@RequestBody Map<String, Object> body,
                          @AuthenticationPrincipal AppUserPrincipal principal) {
        return service.create(body, principal == null ? "System" : principal.name());
    }

    @PostMapping("/{id}/authorize")
    public Payment authorize(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return service.authorize(id, principal == null ? "System" : principal.name());
    }

    @PostMapping("/{id}/reject")
    public Payment reject(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return service.reject(id, principal == null ? "System" : principal.name());
    }

    @PostMapping("/{id}/reverse")
    public Payment reverse(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return service.reverse(id, principal == null ? "System" : principal.name());
    }

    @PostMapping("/mass-transfer")
    public Map<String, Object> massTransfer(@RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal AppUserPrincipal principal) {
        Object legs = body.get("legs");
        if (!(legs instanceof List<?> list)) throw new IllegalArgumentException("legs must be an array");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> typed = (List<Map<String, Object>>) (List<?>) list;
        int count = service.massTransfer(typed, principal == null ? "System" : principal.name());
        return Map.of("posted", count);
    }
}
