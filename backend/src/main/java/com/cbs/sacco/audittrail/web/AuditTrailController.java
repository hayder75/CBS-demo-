package com.cbs.sacco.audittrail.web;

import com.cbs.sacco.audittrail.entity.AuditTrailEntry;
import com.cbs.sacco.audittrail.service.AuditTrailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-trail")
public class AuditTrailController {

    private final AuditTrailService service;

    public AuditTrailController(AuditTrailService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditTrailEntry> list(@RequestParam(required = false) String entity,
                                      @RequestParam(required = false) String action,
                                      @RequestParam(required = false) String actor,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(required = false) String from,
                                      @RequestParam(required = false) String to) {
        return service.list(entity, action, actor, q, from, to);
    }

    @GetMapping("/verify")
    public Map<String, Object> verify() {
        return service.verify();
    }

    @GetMapping("/actors")
    public List<String> actors() {
        return service.actors();
    }
}
