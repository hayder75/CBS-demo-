package com.cbs.sacco.checkoff.web;

import com.cbs.sacco.checkoff.entity.CheckOffBatch;
import com.cbs.sacco.checkoff.repo.CheckOffBatchRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkoff")
public class CheckOffController {

    private final CheckOffBatchRepository repository;

    public CheckOffController(CheckOffBatchRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CheckOffBatch> list() {
        return repository.findAll();
    }

    @PostMapping("/upload")
    public CheckOffBatch upload(@RequestBody(required = false) Map<String, String> body) {
        CheckOffBatch batch = new CheckOffBatch();
        batch.setEmployer(body != null ? body.getOrDefault("employer", "Ministry of Education") : "Ministry of Education");
        batch.setMonth(body != null ? body.getOrDefault("month", "Sep 2026") : "Sep 2026");
        batch.setUploadedAt(Instant.now());
        batch.setRows(87);
        batch.setMatched(87);
        batch.setUnmatched(0);
        batch.setExpected(new BigDecimal("94000"));
        batch.setReceived(new BigDecimal("94000"));
        batch.setVariance(BigDecimal.ZERO);
        batch.setStatus("Reconciled");
        return repository.save(batch);
    }
}