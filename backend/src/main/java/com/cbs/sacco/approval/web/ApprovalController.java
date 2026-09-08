package com.cbs.sacco.approval.web;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.service.ApprovalService;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    public List<Approval> list() {
        return approvalService.list();
    }

    @PostMapping("/{id}/approve")
    public Approval approve(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return approvalService.decide(id, "approve", principal);
    }

    @PostMapping("/{id}/reject")
    public Approval reject(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return approvalService.decide(id, "reject", principal);
    }
}