package com.cbs.sacco.savings.web;

import com.cbs.sacco.savings.entity.SavingsProduct;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsProductRepository;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import com.cbs.sacco.savings.service.SavingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/savings")
public class SavingsController {

    private final SavingsProductRepository productRepository;
    private final SavingsTransactionRepository transactionRepository;
    private final SavingsService savingsService;

    public SavingsController(SavingsProductRepository productRepository,
                             SavingsTransactionRepository transactionRepository,
                             SavingsService savingsService) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.savingsService = savingsService;
    }

    @GetMapping("/products")
    public List<SavingsProduct> products() {
        return productRepository.findAll();
    }

    @GetMapping("/transactions")
    public List<SavingsTransaction> transactions() {
        return transactionRepository.findAll();
    }

    @GetMapping("/transactions/{memberId}")
    public List<SavingsTransaction> transactionsByMember(@PathVariable Long memberId) {
        return transactionRepository.findByMemberIdOrderByDateDesc(memberId);
    }

    @PostMapping("/products")
    public SavingsProduct createProduct(@RequestBody SavingsProduct product) {
        if (product.getCode() == null || product.getCode().isBlank()
                || product.getName() == null || product.getName().isBlank()
                || product.getType() == null || product.getType().isBlank()) {
            throw new IllegalArgumentException("code, name and type are required");
        }
        if (product.getInterestRatePct() == null || product.getInterestRatePct().signum() < 0) {
            throw new IllegalArgumentException("interestRatePct must be non-negative");
        }

        String interestMethod = product.getInterestMethod();
        if (interestMethod == null || interestMethod.isBlank()) {
            interestMethod = "Daily Outstanding";
        }
        if (!"Daily Outstanding".equals(interestMethod) && !"Minimum Balance".equals(interestMethod)) {
            throw new IllegalArgumentException("interestMethod must be 'Daily Outstanding' or 'Minimum Balance'");
        }
        product.setInterestMethod(interestMethod);

        String frequency = product.getMaintenanceFeeFrequency();
        if (frequency == null || frequency.isBlank()) {
            frequency = "None";
        }
        if (!List.of("None", "Monthly", "Quarterly", "Annually").contains(frequency)) {
            throw new IllegalArgumentException("maintenanceFeeFrequency must be None, Monthly, Quarterly or Annually");
        }
        product.setMaintenanceFeeFrequency(frequency);

        if (product.getMaintenanceFee() == null) product.setMaintenanceFee(BigDecimal.ZERO);
        if (product.getPassbookFee() == null) product.setPassbookFee(BigDecimal.ZERO);
        if (product.getOverdraftLimit() == null) product.setOverdraftLimit(BigDecimal.ZERO);
        if (product.getMinBalance() == null) product.setMinBalance(BigDecimal.ZERO);

        if (product.getMaintenanceFee().signum() < 0
                || product.getPassbookFee().signum() < 0
                || product.getOverdraftLimit().signum() < 0
                || product.getMinBalance().signum() < 0) {
            throw new IllegalArgumentException("fees, overdraftLimit and minBalance must be non-negative");
        }
        if (product.getLockInMonths() < 0) {
            throw new IllegalArgumentException("lockInMonths must be non-negative");
        }
        if (!product.isOverdraftAllowed()) {
            product.setOverdraftLimit(BigDecimal.ZERO);
        }
        return productRepository.save(product);
    }

    @PostMapping("/transactions")
    public SavingsTransaction transact(@RequestBody Map<String, Object> body) {
        Long memberId = asLong(body, "memberId");
        Long productId = asLong(body, "productId");
        String type = body.get("type") != null ? body.get("type").toString() : null;
        BigDecimal amount = asDecimal(body, "amount");
        String teller = body.get("teller") != null ? body.get("teller").toString() : null;
        String channel = body.get("channel") != null ? body.get("channel").toString() : null;
        return savingsService.transact(memberId, productId, type, amount, teller, channel);
    }

    @PostMapping("/interest")
    public Map<String, Object> postInterest() {
        int count = savingsService.postMonthlyInterest();
        return Map.of("posted", count);
    }

    @PostMapping("/maintenance-fees")
    public Map<String, Object> postMaintenanceFees() {
        return savingsService.postMaintenanceFees();
    }

    @PostMapping("/passbook-fee")
    public Map<String, Object> chargePassbookFee(@RequestBody Map<String, Object> body) {
        Long memberId = asLong(body, "memberId");
        Long productId = asLong(body, "productId");
        if (memberId == null || productId == null) {
            throw new IllegalArgumentException("memberId and productId are required");
        }
        return savingsService.chargePassbookFee(memberId, productId);
    }

    private static Long asLong(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static BigDecimal asDecimal(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }
}