package com.cbs.sacco.usergroup.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.usergroup.entity.UserGroup;
import com.cbs.sacco.usergroup.repo.UserGroupRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-groups")
public class UserGroupController {

    private final UserGroupRepository repo;

    public UserGroupController(UserGroupRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<UserGroup> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public UserGroup get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("User group not found: " + id));
    }

    @PostMapping
    public UserGroup create(@RequestBody Map<String, Object> body) {
        String name = str(body, "name");
        String code = str(body, "code");
        if (name == null || code == null) throw new IllegalArgumentException("name and code are required");
        if (repo.existsByCode(code)) throw new IllegalArgumentException("group code already exists: " + code);
        UserGroup g = new UserGroup();
        g.setName(name);
        g.setCode(code);
        g.setMaxLoginAttempts(intOr(body, "maxLoginAttempts", 5));
        g.setMultipleMachineLogins(bool(body, "multipleMachineLogins", false));
        g.setBranchSpecific(bool(body, "branchSpecific", false));
        g.setMultipleUsers(bool(body, "multipleUsers", true));
        g.setDescription(str(body, "description"));
        g.setPermissions(permissions(body.get("permissions")));
        g.setStatus(orDefault(str(body, "status"), "Pending"));
        return repo.save(g);
    }

    @PutMapping("/{id}")
    public UserGroup update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        UserGroup g = get(id);
        if (body.containsKey("name")) g.setName(str(body, "name"));
        if (body.containsKey("maxLoginAttempts")) g.setMaxLoginAttempts(intOr(body, "maxLoginAttempts", g.getMaxLoginAttempts()));
        if (body.containsKey("multipleMachineLogins")) g.setMultipleMachineLogins(bool(body, "multipleMachineLogins", g.getMultipleMachineLogins()));
        if (body.containsKey("branchSpecific")) g.setBranchSpecific(bool(body, "branchSpecific", g.getBranchSpecific()));
        if (body.containsKey("multipleUsers")) g.setMultipleUsers(bool(body, "multipleUsers", g.getMultipleUsers()));
        if (body.containsKey("description")) g.setDescription(str(body, "description"));
        if (body.containsKey("permissions")) g.setPermissions(permissions(body.get("permissions")));
        if (body.containsKey("status")) g.setStatus(str(body, "status"));
        return repo.save(g);
    }

    @PostMapping("/{id}/verify")
    public UserGroup verify(@PathVariable Long id) {
        UserGroup g = get(id);
        g.setStatus("Verified");
        return repo.save(g);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    @SuppressWarnings("unchecked")
    private static String permissions(Object v) {        if (v == null) return "";
        if (v instanceof List<?> list) {
            return String.join(",", list.stream().map(String::valueOf).toArray(String[]::new));
        }
        return v.toString().replace(" ", "");
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static boolean bool(Map<String, Object> body, String key, boolean fallback) {
        Object v = body.get(key);
        return v == null ? fallback : Boolean.parseBoolean(v.toString());
    }

    private static int intOr(Map<String, Object> body, String key, int fallback) {
        Object v = body.get(key);
        if (v == null) return fallback;
        try {
            return v instanceof Number n ? n.intValue() : Integer.parseInt(v.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static String orDefault(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }
}
