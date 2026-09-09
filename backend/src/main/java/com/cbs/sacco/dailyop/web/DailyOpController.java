package com.cbs.sacco.dailyop.web;

import com.cbs.sacco.dailyop.entity.DailyOperation;
import com.cbs.sacco.dailyop.repo.DailyOperationRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dop")
public class DailyOpController {
    private final DailyOperationRepository repo;
    public DailyOpController(DailyOperationRepository repo) { this.repo = repo; }

    @GetMapping
    public List<DailyOperation> list() { return repo.findAll(); }

    @GetMapping("/open")
    public DailyOperation open() {
        return repo.findFirstByStatus("Open").orElseThrow(() -> new NotFoundException("No open daily operation"));
    }

    @PostMapping("/start")
    public DailyOperation start(@RequestBody Map<String, Object> body) {
        // Start-of-day: any previously open operation for the same date/branch
        // is closed first (start over), matching the DOP workflow.
        repo.findFirstByStatus("Open").ifPresent(open -> {
            open.setStatus("Closed");
            open.setClosedBy(str(body, "openedBy"));
            open.setClosedAt(Instant.now());
            repo.save(open);
        });
        DailyOperation d = new DailyOperation();
        if (body.get("branchId") != null) d.setBranchId(Long.valueOf(body.get("branchId").toString()));
        if (body.get("vaultId") != null) d.setVaultId(Long.valueOf(body.get("vaultId").toString()));
        d.setOpenedBy(str(body, "openedBy"));
        d.setStatus("Open");
        return repo.save(d);
    }

    @PostMapping("/close")
    public DailyOperation close(@RequestBody Map<String, Object> body) {
        DailyOperation d = repo.findFirstByStatus("Open").orElseThrow(
                () -> new IllegalStateException("No open daily operation to close"));
        d.setStatus("Closed");
        d.setClosedBy(str(body, "closedBy"));
        d.setClosedAt(Instant.now());
        return repo.save(d);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
