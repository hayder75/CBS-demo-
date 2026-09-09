package com.cbs.sacco.asset.web;

import com.cbs.sacco.asset.entity.FixedAsset;
import com.cbs.sacco.asset.repo.FixedAssetRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
public class AssetController {
    private final FixedAssetRepository repo;
    public AssetController(FixedAssetRepository repo) { this.repo = repo; }

    @GetMapping
    public List<FixedAsset> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public FixedAsset get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Asset not found: " + id)); }

    @PostMapping
    public FixedAsset create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        FixedAsset a = new FixedAsset();
        a.setCode(code);
        a.setName(name);
        if (body.get("value") != null) a.setValue(new BigDecimal(body.get("value").toString()));
        if (body.get("depreciationRate") != null) a.setDepreciationRate(new BigDecimal(body.get("depreciationRate").toString()));
        a.setDprLink(str(body, "dprLink"));
        a.setGlLink(str(body, "glLink"));
        a.setBranch(str(body, "branch"));
        a.setStatus("Active");
        return repo.save(a);
    }

    @PutMapping("/{id}")
    public FixedAsset update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FixedAsset a = get(id);
        if (body.containsKey("name")) a.setName(str(body, "name"));
        if (body.get("value") != null) a.setValue(new BigDecimal(body.get("value").toString()));
        if (body.containsKey("status")) a.setStatus(str(body, "status"));
        return repo.save(a);
    }

    @PostMapping("/{id}/depreciate")
    public FixedAsset depreciate(@PathVariable Long id) {
        FixedAsset a = get(id);
        // straight-line annual depreciation on current value
        BigDecimal dep = a.getValue().multiply(a.getDepreciationRate()).divide(new BigDecimal("100"));
        a.setValue(a.getValue().subtract(dep));
        return repo.save(a);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
