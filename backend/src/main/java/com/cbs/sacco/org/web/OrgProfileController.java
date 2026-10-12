package com.cbs.sacco.org.web;

import com.cbs.sacco.org.entity.OrgProfile;
import com.cbs.sacco.org.repo.OrgProfileRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/org-profile")
public class OrgProfileController {

    private final OrgProfileRepository repo;

    public OrgProfileController(OrgProfileRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public OrgProfile get() {
        return repo.findAll().stream().findFirst().orElseGet(() -> {
            OrgProfile p = new OrgProfile();
            p.setName("SACCO");
            return repo.save(p);
        });
    }

    @PutMapping
    public OrgProfile update(@RequestBody Map<String, Object> body) {
        OrgProfile p = get();
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("legalName")) p.setLegalName(str(body, "legalName"));
        if (body.containsKey("registrationNo")) p.setRegistrationNo(str(body, "registrationNo"));
        if (body.containsKey("tin")) p.setTin(str(body, "tin"));
        if (body.containsKey("phone")) p.setPhone(str(body, "phone"));
        if (body.containsKey("email")) p.setEmail(str(body, "email"));
        if (body.containsKey("address")) p.setAddress(str(body, "address"));
        if (body.containsKey("city")) p.setCity(str(body, "city"));
        if (body.containsKey("country")) p.setCountry(str(body, "country"));
        if (body.containsKey("currencyCode")) p.setCurrencyCode(str(body, "currencyCode"));
        if (body.containsKey("fiscalYearStart")) p.setFiscalYearStart(str(body, "fiscalYearStart"));
        if (body.containsKey("logoColor")) p.setLogoColor(str(body, "logoColor"));
        if (body.containsKey("status")) p.setStatus(str(body, "status"));
        return repo.save(p);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
