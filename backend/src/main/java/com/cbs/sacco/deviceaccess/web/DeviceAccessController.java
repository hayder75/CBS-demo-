package com.cbs.sacco.deviceaccess.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.deviceaccess.entity.DeviceAccess;
import com.cbs.sacco.deviceaccess.repo.DeviceAccessRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/device-accesses")
public class DeviceAccessController {

    private final DeviceAccessRepository repo;

    public DeviceAccessController(DeviceAccessRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<DeviceAccess> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public DeviceAccess get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Device access not found: " + id));
    }

    @PostMapping
    public DeviceAccess create(@RequestBody Map<String, Object> body) {
        String username = str(body, "username");
        if (username == null) throw new IllegalArgumentException("username is required");
        DeviceAccess d = new DeviceAccess();
        d.setUsername(username);
        d.setDeviceName(str(body, "deviceName"));
        d.setDeviceId(str(body, "deviceId"));
        d.setIpAddress(str(body, "ipAddress"));
        d.setLocation(str(body, "location"));
        d.setAuthorized(false);
        d.setLastSeen(Instant.now());
        d.setStatus("Pending");
        return repo.save(d);
    }

    @PostMapping("/{id}/authorize")
    public DeviceAccess authorize(@PathVariable Long id) {
        DeviceAccess d = get(id);
        d.setAuthorized(true);
        d.setStatus("Authorized");
        return repo.save(d);
    }

    @PostMapping("/{id}/block")
    public DeviceAccess block(@PathVariable Long id) {
        DeviceAccess d = get(id);
        d.setAuthorized(false);
        d.setStatus("Blocked");
        return repo.save(d);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
