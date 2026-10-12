package com.cbs.sacco.loanconfig.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loanconfig.entity.LoanConfig;
import com.cbs.sacco.loanconfig.repo.LoanConfigRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-config")
public class LoanConfigController {

    private final LoanConfigRepository repo;

    public LoanConfigController(LoanConfigRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<LoanConfig> list() {
        return repo.findAll();
    }

    @PutMapping("/{key}")
    public LoanConfig update(@PathVariable String key, @RequestBody Map<String, Object> body) {
        LoanConfig c = repo.findByConfigKey(key)
                .orElseThrow(() -> new NotFoundException("Loan config not found: " + key));
        Object v = body.get("configValue");
        if (v == null) throw new IllegalArgumentException("configValue is required");
        c.setConfigValue(v.toString());
        if (body.containsKey("description")) c.setDescription(str(body, "description"));
        return repo.save(c);
    }

    @PostMapping
    public LoanConfig create(@RequestBody Map<String, Object> body) {
        String key = str(body, "configKey");
        String value = str(body, "configValue");
        if (key == null || value == null) throw new IllegalArgumentException("configKey and configValue are required");
        if (repo.findByConfigKey(key).isPresent()) throw new IllegalArgumentException("config key exists: " + key);
        LoanConfig c = new LoanConfig();
        c.setConfigKey(key);
        c.setConfigValue(value);
        c.setValueType(str(body, "valueType") == null ? "TEXT" : str(body, "valueType"));
        c.setDescription(str(body, "description"));
        c.setConfigGroup(str(body, "configGroup") == null ? "General" : str(body, "configGroup"));
        return repo.save(c);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
