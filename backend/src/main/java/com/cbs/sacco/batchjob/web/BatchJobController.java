package com.cbs.sacco.batchjob.web;

import com.cbs.sacco.batchjob.entity.BatchJob;
import com.cbs.sacco.batchjob.repo.BatchJobRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batch-jobs")
public class BatchJobController {
    private final BatchJobRepository repo;
    public BatchJobController(BatchJobRepository repo) { this.repo = repo; }

    @GetMapping
    public List<BatchJob> list() { return repo.findAll(); }

    @PostMapping
    public BatchJob create(@RequestBody Map<String, Object> body) {
        String type = str(body, "jobType");
        String name = str(body, "name");
        if (type == null || name == null) throw new IllegalArgumentException("jobType and name are required");
        BatchJob j = new BatchJob();
        j.setJobType(type);
        j.setName(name);
        j.setStatus("Idle");
        return repo.save(j);
    }

    @PostMapping("/{id}/run")
    public BatchJob run(@PathVariable Long id) {
        BatchJob j = repo.findById(id).orElseThrow(() -> new NotFoundException("Job not found: " + id));
        j.setStatus("Running");
        // simulate: mark Done with timestamp
        j.setStatus("Done");
        j.setLastRunAt(Instant.now());
        return repo.save(j);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
