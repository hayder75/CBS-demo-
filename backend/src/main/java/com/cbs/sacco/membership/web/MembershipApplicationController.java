package com.cbs.sacco.membership.web;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.membership.entity.MembershipApplication;
import com.cbs.sacco.membership.repo.MembershipApplicationRepository;
import com.cbs.sacco.sharecategory.entity.ShareAccount;
import com.cbs.sacco.sharecategory.repo.ShareAccountRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/membership-applications")
public class MembershipApplicationController {

    private static final BigDecimal ENTRANCE_FEE = new BigDecimal("200");
    private static final BigDecimal REGISTRATION_FEE = new BigDecimal("50");

    private final MembershipApplicationRepository repo;
    private final MemberRepository memberRepository;
    private final SavingsAccountRepository savingsAccountRepository;
    private final ShareAccountRepository shareAccountRepository;

    public MembershipApplicationController(
            MembershipApplicationRepository repo,
            MemberRepository memberRepository,
            SavingsAccountRepository savingsAccountRepository,
            ShareAccountRepository shareAccountRepository) {
        this.repo = repo;
        this.memberRepository = memberRepository;
        this.savingsAccountRepository = savingsAccountRepository;
        this.shareAccountRepository = shareAccountRepository;
    }

    @GetMapping
    public List<MembershipApplication> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public MembershipApplication get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(
                () -> new NotFoundException("Membership application not found: " + id));
    }

    @PostMapping
    public MembershipApplication create(@RequestBody Map<String, Object> body) {
        String fullName = str(body, "fullName");
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("fullName is required");
        }
        String phone = str(body, "phone");
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("phone is required");
        }
        Integer shareCount = intOf(body, "shareCount");
        if (shareCount == null || shareCount < 1) {
            throw new IllegalArgumentException("shareCount must be at least 1");
        }

        MembershipApplication app = new MembershipApplication();
        app.setApplicationNo("APP-2026-" + String.format("%03d", repo.count() + 1));
        app.setApplicantType("Entity".equalsIgnoreCase(str(body, "applicantType")) ? "Entity" : "Individual");
        app.setFullName(fullName);
        app.setFaydaId(str(body, "faydaId"));
        app.setPhone(phone);
        app.setEmail(str(body, "email"));
        app.setEmployer(str(body, "employer"));
        app.setBranch(str(body, "branch") == null ? "Head Office" : str(body, "branch"));
        app.setShareProductId(lng(body.get("shareProductId")));
        app.setShareCount(shareCount);
        app.setCompulsoryProductId(lng(body.get("compulsoryProductId")));
        app.setEntranceFee(ENTRANCE_FEE);
        app.setRegistrationFee(REGISTRATION_FEE);
        app.setPaymentStatus("Unpaid");
        app.setChannel("Portal".equalsIgnoreCase(str(body, "channel")) ? "Portal" : "Staff");
        app.setStatus("Pending");
        app.setSubmittedAt(Instant.now());
        return repo.save(app);
    }

    @PostMapping("/{id}/pay")
    public MembershipApplication pay(@PathVariable Long id) {
        MembershipApplication app = get(id);
        if (!"Pending".equals(app.getStatus())) {
            throw new IllegalArgumentException("Application already decided");
        }
        app.setPaymentStatus("Paid");
        return repo.save(app);
    }

    @PostMapping("/{id}/approve")
    @Transactional
    public MembershipApplication approve(@PathVariable Long id) {
        MembershipApplication app = get(id);
        if (!"Pending".equals(app.getStatus())) {
            throw new IllegalArgumentException("Application already decided");
        }
        if (!"Paid".equals(app.getPaymentStatus())) {
            throw new IllegalArgumentException("Payment required before approval");
        }

        Long memberCount = memberRepository.count();
        Member member = new Member();
        member.setMemberNo("MEM-" + String.format("%05d", memberCount + 1));
        member.setFullName(app.getFullName());
        member.setGender("M");
        member.setPhone(app.getPhone());
        member.setEmail(app.getEmail());
        member.setFaydaId(app.getFaydaId());
        member.setEmployer(app.getEmployer());
        member.setCity("Addis Ababa");
        member.setJoinDate(LocalDate.now());
        member.setStatus("Active");
        member.setShareBalance(BigDecimal.ZERO);
        member.setSavingsBalance(BigDecimal.ZERO);
        member.setLoanOutstanding(BigDecimal.ZERO);
        member = memberRepository.save(member);

        Long savingAccountId = null;
        if (app.getCompulsoryProductId() != null) {
            SavingsAccount account = new SavingsAccount();
            account.setAccountNo("SA-" + member.getMemberNo() + "-1");
            account.setMemberId(member.getId());
            account.setProductId(app.getCompulsoryProductId());
            account.setAccountType("Saving");
            account.setOpenedDate(LocalDate.now());
            account.setBalance(BigDecimal.ZERO);
            account.setStatus("Active");
            account.setCurrencyId(1L);
            account.setBranchId(1L);
            savingAccountId = savingsAccountRepository.save(account).getId();
        }

        ShareAccount shareAccount = new ShareAccount();
        shareAccount.setMemberId(member.getId());
        shareAccount.setCategoryId(app.getShareProductId());
        shareAccount.setSavingAccountId(savingAccountId);
        shareAccount.setShareCount(app.getShareCount() == null ? 0 : app.getShareCount());
        shareAccount.setDescription("Provisioned from " + app.getApplicationNo());
        shareAccount.setStatus("Verified");
        shareAccount = shareAccountRepository.save(shareAccount);

        app.setStatus("Approved");
        app.setDecidedBy("Tigist Fikre");
        app.setDecidedAt(Instant.now());
        app.setCreatedMemberId(member.getId());
        app.setCreatedShareAccountId(shareAccount.getId());
        return repo.save(app);
    }

    @PostMapping("/{id}/reject")
    public MembershipApplication reject(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        MembershipApplication app = get(id);
        if (!"Pending".equals(app.getStatus())) {
            throw new IllegalArgumentException("Application already decided");
        }
        String reason = str(body, "reason");
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        app.setStatus("Rejected");
        app.setRejectReason(reason);
        app.setDecidedBy("Tigist Fikre");
        app.setDecidedAt(Instant.now());
        return repo.save(app);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer intOf(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static Long lng(Object v) {
        if (v == null) return null;
        try {
            return Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid numeric value: " + v);
        }
    }
}
