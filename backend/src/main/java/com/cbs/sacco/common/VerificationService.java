package com.cbs.sacco.common;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class VerificationService {

    private final ApprovalRepository approvalRepository;
    private final AuditService auditService;

    public VerificationService(ApprovalRepository approvalRepository, AuditService auditService) {
        this.approvalRepository = approvalRepository;
        this.auditService = auditService;
    }

    public List<Approval> pending() {
        return approvalRepository.findAll().stream().filter(a -> "Pending".equals(a.getStatus())).toList();
    }

    public Approval verify(Long id, boolean approve, AppUserPrincipal principal) {
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Approval/verification not found: " + id));
        if (!"Pending".equals(approval.getStatus())) {
            throw new IllegalStateException("Item " + id + " is already " + approval.getStatus());
        }
        if (approval.getInitiatedBy().equalsIgnoreCase(principal.name())) {
            throw new IllegalStateException("Maker-checker violated: initiator cannot verify their own item");
        }
        approval.setStatus(approve ? "Verified" : "Rejected");
        approval.setApprovedBy(principal.name());
        approval.setDecidedAt(Instant.now());
        Approval saved = approvalRepository.save(approval);
        auditService.record(principal.username(), "VERIFY_" + approval.getType().toUpperCase(),
                approval.getType(), String.valueOf(approval.getRef()), approval.getSummary());
        return saved;
    }

    @Transactional
    public Approval requestVerification(String type, String ref, String summary, BigDecimal amount, String initiatedBy) {
        Approval approval = new Approval();
        approval.setType(type);
        approval.setRef(ref);
        approval.setSummary(summary);
        approval.setAmount(amount == null ? BigDecimal.ZERO : amount);
        approval.setInitiatedBy(initiatedBy == null ? "System" : initiatedBy);
        approval.setRequestedAt(Instant.now());
        approval.setStatus("Pending");
        return approvalRepository.save(approval);
    }
}
