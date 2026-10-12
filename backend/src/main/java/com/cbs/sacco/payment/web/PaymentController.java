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

    /**
     * FRANC-style authorization categories. Returns the 15 transaction families with
     * pending counts so the checker can drill into each queue.
     */
    @GetMapping("/authorize/categories")
    public List<Map<String, Object>> authorizeCategories() {
        record Cat(String key, String name, String description, List<String> kinds) {}
        List<Cat> cats = List.of(
                new Cat("CUSTOMER_DEPOSIT", "Customer Deposits", "Deposits funds into member accounts", List.of("DEPOSIT")),
                new Cat("CUSTOMER_WITHDRAWAL", "Customer Withdrawals", "Withdrawals from member accounts", List.of("WITHDRAWAL")),
                new Cat("SHARE_WITHDRAWAL", "Share Withdrawals", "Withdrawal of shares from member accounts", List.of("SHARE_WITHDRAWAL")),
                new Cat("SHARE_TRANSFER", "Share Transfers", "Movement of shares between member accounts", List.of("SHARE_TRANSFER")),
                new Cat("CUSTOMER_ADJUSTMENT", "Customer Adjustments", "Period-end corrections to member balances", List.of("ADJUSTMENT", "CUSTOMER_ADJUSTMENT")),
                new Cat("OUTGOING_CLAIM", "Outgoing Claims", "Branch transferring funds to another branch GL", List.of("BRANCH_CLAIM", "OUTGOING_CLAIM")),
                new Cat("TILL", "Till Transactions", "Cash movement within the till network", List.of("TILL")),
                new Cat("RECEIPT_VOUCHER", "Receipt Voucher", "Incoming receipt posted to the GL", List.of("RECEIPT_VOUCHER")),
                new Cat("MANUAL_DEPOSIT", "Manual Deposits/Credits", "Direct credit to a GL account", List.of("MANUAL_DEPOSIT")),
                new Cat("MANUAL_WITHDRAWAL", "Manual Withdrawals/Debits", "Direct debit from a GL account", List.of("MANUAL_WITHDRAWAL")),
                new Cat("ACCOUNT_TRANSFER", "Account Transfers", "Transfer between accounts within the organisation", List.of("TRANSFER", "ACCOUNT_TRANSFER")),
                new Cat("MASS_TRANSFER", "Mass Transfers", "One-to-many / many-to-many transfers", List.of("MASS", "MASS_TRANSFER")),
                new Cat("MANUAL_ADJUSTMENT", "Manual Adjustments", "Period-end GL corrections", List.of("MANUAL_ADJUSTMENT")),
                new Cat("INCOMING_CLAIM", "Incoming Claims", "Branch claiming funds owed by another branch GL", List.of("INCOMING_CLAIM")),
                new Cat("PAYMENT_VOUCHER", "Payment Voucher", "Outgoing payment settled through the GL", List.of("PAYMENT_VOUCHER"))
        );
        List<Payment> pending = service.byStatus("Pending");
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Cat c : cats) {
            long count = pending.stream().filter(p -> c.kinds().contains(p.getKind())).count();
            out.add(Map.of(
                    "key", c.key(),
                    "name", c.name(),
                    "description", c.description(),
                    "kinds", c.kinds(),
                    "pending", count));
        }
        return out;
    }
}
