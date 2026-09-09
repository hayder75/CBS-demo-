package com.cbs.sacco.sharecategory.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.sharecategory.entity.ShareAccount;
import com.cbs.sacco.sharecategory.entity.ShareRequest;
import com.cbs.sacco.sharecategory.repo.ShareAccountRepository;
import com.cbs.sacco.sharecategory.repo.ShareRequestRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/share-accounts")
public class ShareAccountController {
    private final ShareAccountRepository repo;
    private final ShareRequestRepository requestRepo;
    public ShareAccountController(ShareAccountRepository repo, ShareRequestRepository requestRepo) {
        this.repo = repo;
        this.requestRepo = requestRepo;
    }

    @GetMapping
    public List<ShareAccount> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ShareAccount get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Share account not found: " + id)); }

    @PostMapping
    public ShareAccount create(@RequestBody Map<String, Object> body) {
        Long memberId = lng(body.get("memberId"));
        Long categoryId = lng(body.get("categoryId"));
        if (memberId == null || categoryId == null) throw new IllegalArgumentException("memberId and categoryId are required");
        ShareAccount a = new ShareAccount();
        a.setMemberId(memberId);
        a.setCategoryId(categoryId);
        a.setSavingAccountId(lng(body.get("savingAccountId")));
        if (body.get("shareCount") != null) a.setShareCount((int) Double.parseDouble(body.get("shareCount").toString()));
        a.setDescription(str(body, "description"));
        a.setStatus("Pending");
        return repo.save(a);
    }

    @PostMapping("/{id}/verify")
    public ShareAccount verify(@PathVariable Long id) {
        ShareAccount a = get(id);
        a.setStatus("Verified");
        return repo.save(a);
    }

    @GetMapping("/requests")
    public List<ShareRequest> requests() { return requestRepo.findAll(); }

    @PostMapping("/{id}/upgrade")
    public ShareRequest upgrade(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return newRequest(id, "UPGRADE", body);
    }

    @PostMapping("/{id}/downgrade")
    public ShareRequest downgrade(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return newRequest(id, "DOWNGRADE", body);
    }

    @PostMapping("/requests/{reqId}/decide")
    public ShareRequest decide(@PathVariable Long reqId, @RequestParam boolean approve) {
        ShareRequest r = requestRepo.findById(reqId).orElseThrow(() -> new NotFoundException("Request not found: " + reqId));
        r.setStatus(approve ? "Approved" : "Rejected");
        if (approve) {
            ShareAccount a = repo.findById(r.getShareAccountId()).orElseThrow(() -> new NotFoundException("Share account not found"));
            a.setShareCount(a.getShareCount() + ("UPGRADE".equals(r.getRequestType()) ? r.getShareCount() : -r.getShareCount()));
            repo.save(a);
        }
        return requestRepo.save(r);
    }

    private ShareRequest newRequest(Long accountId, String type, Map<String, Object> body) {
        ShareRequest r = new ShareRequest();
        r.setShareAccountId(accountId);
        r.setRequestType(type);
        if (body.get("shareCount") != null) r.setShareCount((int) Double.parseDouble(body.get("shareCount").toString()));
        r.setStatus("Pending");
        return requestRepo.save(r);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
