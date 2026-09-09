package com.cbs.sacco.currency.web;

import com.cbs.sacco.currency.entity.Currency;
import com.cbs.sacco.currency.repo.CurrencyRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.common.VerificationService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/currencies")
public class CurrencyController {
    private final CurrencyRepository repo;
    public CurrencyController(CurrencyRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Currency> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Currency get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Currency not found: " + id)); }

    @PostMapping
    public Currency create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        Currency c = new Currency();
        c.setCode(code);
        c.setName(name);
        c.setNotesLabel(str(body, "notesLabel"));
        c.setCentsLabel(str(body, "centsLabel"));
        if (body.get("exchangeRate") != null) c.setExchangeRate(new BigDecimal(body.get("exchangeRate").toString()));
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public Currency update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Currency c = get(id);
        if (body.containsKey("name")) c.setName(str(body, "name"));
        if (body.containsKey("exchangeRate") && body.get("exchangeRate") != null) c.setExchangeRate(new BigDecimal(body.get("exchangeRate").toString()));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public Currency verify(@PathVariable Long id) { Currency c = get(id); c.setStatus("Verified"); return repo.save(c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
