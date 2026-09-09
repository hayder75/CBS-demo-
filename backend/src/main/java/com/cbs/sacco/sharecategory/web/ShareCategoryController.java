package com.cbs.sacco.sharecategory.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.sharecategory.entity.ShareCategory;
import com.cbs.sacco.sharecategory.repo.ShareCategoryRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/share-categories")
public class ShareCategoryController {
    private final ShareCategoryRepository repo;
    public ShareCategoryController(ShareCategoryRepository repo) { this.repo = repo; }

    @GetMapping
    public List<ShareCategory> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ShareCategory get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Share category not found: " + id)); }

    @PostMapping
    public ShareCategory create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        ShareCategory c = new ShareCategory();
        c.setCode(code);
        c.setName(name);
        c.setTotalShares(intv(body.get("totalShares")));
        if (body.get("nominalPrice") != null) c.setNominalPrice(new BigDecimal(body.get("nominalPrice").toString()));
        c.setSharesForSale(intv(body.get("sharesForSale")));
        c.setMinPerCustomer(intv(body.get("minPerCustomer")));
        c.setMaxPerCustomer(intv(body.get("maxPerCustomer")));
        c.setPaymentAgreementMonths(intv(body.get("paymentAgreementMonths")));
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public ShareCategory update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ShareCategory c = get(id);
        if (body.containsKey("name")) c.setName(str(body, "name"));
        if (body.get("nominalPrice") != null) c.setNominalPrice(new BigDecimal(body.get("nominalPrice").toString()));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public ShareCategory verify(@PathVariable Long id) { ShareCategory c = get(id); c.setStatus("Verified"); return repo.save(c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
    private static Integer intv(Object v) {
        if (v == null) return 0;
        try { return (int) Double.parseDouble(v.toString()); } catch (NumberFormatException e) { return 0; }
    }
}
