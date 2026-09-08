package com.cbs.sacco.collateral.web;

import com.cbs.sacco.collateral.entity.Collateral;
import com.cbs.sacco.collateral.repo.CollateralRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collateral")
public class CollateralController {

    private final CollateralRepository repository;

    public CollateralController(CollateralRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Collateral> list() {
        return repository.findAll();
    }

    @PostMapping
    public Collateral create(@RequestBody Map<String, Object> body) {
        String type = str(body, "type");
        String owner = str(body, "owner");
        BigDecimal valuation = dec(body, "valuation");
        if (type == null || type.isBlank()) throw new IllegalArgumentException("type is required");
        if (owner == null || owner.isBlank()) throw new IllegalArgumentException("owner is required");
        if (valuation == null || valuation.signum() <= 0) throw new IllegalArgumentException("valuation must be positive");

        Collateral c = new Collateral();
        c.setCode("COL-" + String.format("%03d", repository.count() + 1));
        c.setType(type);
        c.setOwner(owner);
        c.setDescription(str(body, "description"));
        c.setValuation(valuation);
        BigDecimal discount = dec(body, "discountPct");
        if (discount == null) discount = BigDecimal.ZERO;
        c.setDiscountPct(discount);
        c.setForcedSaleValue(valuation.multiply(BigDecimal.ONE.subtract(
                discount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))));
        c.setLoanRef(str(body, "loanRef"));
        c.setStatus("Pledged");
        return repository.save(c);
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