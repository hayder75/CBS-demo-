package com.cbs.sacco.approval.service;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.common.AuditService;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ApprovalService {

    private final ApprovalRepository repository;
    private final AuditService auditService;

    public ApprovalService(ApprovalRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    public List<Approval> list() {
        return repository.findAll();
    }

    @Transactional
    public Approval decide(Long id, String decision, AppUserPrincipal principal) {
        Approval approval = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Approval not found: " + id));

        if (!"Pending".equals(approval.getStatus())) {
            throw new IllegalStateException("Approval " + id + " is already " + approval.getStatus());
        }

        // Maker-checker: initiator cannot be the approver
        if (approval.getInitiatedBy().equalsIgnoreCase(principal.name())) {
            throw new IllegalStateException(
                    "Maker-checker violated: the user who initiated approval " + id
                            + " cannot approve or reject it");
        }

        approval.setStatus("approve".equals(decision) ? "Approved" : "Rejected");
        approval.setApprovedBy(principal.name());
        approval.setDecidedAt(Instant.now());
        repository.save(approval);

        auditService.record(principal.username(), "APPROVAL_" + approval.getStatus().toUpperCase(),
                "approval", String.valueOf(id), approval.getRef() + " - " + approval.getSummary());

        return approval;
    }
}