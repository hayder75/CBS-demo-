package com.cbs.sacco.daycontrol.web;

import com.cbs.sacco.daycontrol.entity.BranchCob;
import com.cbs.sacco.daycontrol.entity.EodRun;
import com.cbs.sacco.daycontrol.entity.EodStep;
import com.cbs.sacco.daycontrol.entity.SystemBusinessDate;
import com.cbs.sacco.daycontrol.repo.BranchCobRepository;
import com.cbs.sacco.daycontrol.repo.EodRunRepository;
import com.cbs.sacco.daycontrol.repo.EodStepRepository;
import com.cbs.sacco.daycontrol.repo.SystemBusinessDateRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/day-control")
public class DayControlController {

    private static final List<String> STEP_NAMES = List.of(
            "Maintenance Fees",
            "TFS Maturity",
            "Loan Auto-Debit",
            "Penalties",
            "Loan Classification",
            "Provisions",
            "Dormant Accounts",
            "Dormant Members");

    private final SystemBusinessDateRepository dateRepo;
    private final BranchCobRepository cobRepo;
    private final EodRunRepository runRepo;
    private final EodStepRepository stepRepo;

    public DayControlController(
            SystemBusinessDateRepository dateRepo,
            BranchCobRepository cobRepo,
            EodRunRepository runRepo,
            EodStepRepository stepRepo) {
        this.dateRepo = dateRepo;
        this.cobRepo = cobRepo;
        this.runRepo = runRepo;
        this.stepRepo = stepRepo;
    }

    @GetMapping
    public Map<String, Object> state() {
        return buildState(current());
    }

    @PostMapping("/cob/close")
    public Map<String, Object> closeBranchCob(@RequestBody Map<String, Object> body) {
        SystemBusinessDate bd = current();
        if ("EOD Completed".equals(bd.getStatus())) {
            throw new IllegalArgumentException("End-of-day is already completed for the current business date");
        }
        Long branchId = longVal(body.get("branchId"));
        BranchCob cob = cobRepo.findByBusinessDateAndBranchId(bd.getBusinessDate(), branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        if ("Closed".equals(cob.getStatus())) {
            throw new IllegalArgumentException("Branch close-of-business is already done");
        }
        cob.setStatus("Closed");
        cob.setClosedBy(str(body, "closedBy"));
        cob.setClosedAt(Instant.now());
        return cobMap(cobRepo.save(cob));
    }

    @PostMapping("/cob/reopen")
    public Map<String, Object> reopenBranchCob(@RequestBody Map<String, Object> body) {
        SystemBusinessDate bd = current();
        if ("EOD Completed".equals(bd.getStatus())) {
            throw new IllegalArgumentException("Cannot reopen a branch after end-of-day is completed");
        }
        Long branchId = longVal(body.get("branchId"));
        BranchCob cob = cobRepo.findByBusinessDateAndBranchId(bd.getBusinessDate(), branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        if ("Open".equals(cob.getStatus())) {
            throw new IllegalArgumentException("Branch close-of-business is already open");
        }
        cob.setStatus("Open");
        cob.setClosedBy(null);
        cob.setClosedAt(null);
        return cobMap(cobRepo.save(cob));
    }

    @PostMapping("/eod/run")
    public Map<String, Object> runEod() {
        SystemBusinessDate bd = current();
        if ("EOD Running".equals(bd.getStatus())) {
            throw new IllegalArgumentException("An end-of-day run is already in progress");
        }
        if ("EOD Completed".equals(bd.getStatus())) {
            throw new IllegalArgumentException("End-of-day has already been completed");
        }
        long open = cobRepo.findByBusinessDateOrderByIdAsc(bd.getBusinessDate()).stream()
                .filter(c -> "Open".equals(c.getStatus()))
                .count();
        if (open > 0) {
            throw new IllegalArgumentException("Cannot run EOD: " + open + " branch(es) still open");
        }

        EodRun run = new EodRun();
        run.setBusinessDate(bd.getBusinessDate());
        run.setStatus("Running");
        run.setStartedAt(Instant.now());
        run.setStartedBy("System");
        bd.setStatus("EOD Running");
        dateRepo.save(bd);
        run = runRepo.save(run);

        List<EodStep> steps = new ArrayList<>();
        int index = 0;
        for (String name : STEP_NAMES) {
            index++;
            EodStep step = new EodStep();
            step.setEodRunId(run.getId());
            step.setKey("step-" + index);
            step.setName(name);
            step.setStatus("Done");
            step.setProcessed(10 + index * 5);
            steps.add(step);
        }
        stepRepo.saveAll(steps);

        run.setStatus("Completed");
        run.setCompletedAt(Instant.now());
        run = runRepo.save(run);

        bd.setStatus("EOD Completed");
        bd.setLastEodDate(bd.getBusinessDate());
        dateRepo.save(bd);

        return runMap(run, steps);
    }

    @PostMapping("/advance")
    public Map<String, Object> advance() {
        SystemBusinessDate bd = current();
        if (!"EOD Completed".equals(bd.getStatus())) {
            throw new IllegalArgumentException("End-of-day must complete before advancing the business date");
        }
        LocalDate next = bd.getNextBusinessDate() != null
                ? bd.getNextBusinessDate()
                : bd.getBusinessDate().plusDays(1);
        bd.setBusinessDate(next);
        bd.setNextBusinessDate(next.plusDays(1));
        bd.setStatus("Open");
        bd.setLastEodDate(null);
        dateRepo.save(bd);

        for (BranchCob cob : cobRepo.findAll()) {
            cob.setBusinessDate(next);
            cob.setStatus("Open");
            cob.setClosedBy(null);
            cob.setClosedAt(null);
            cobRepo.save(cob);
        }
        return buildState(bd);
    }

    private SystemBusinessDate current() {
        return dateRepo.findFirstByOrderByIdAsc().orElseGet(() -> {
            SystemBusinessDate bd = new SystemBusinessDate();
            bd.setBusinessDate(LocalDate.now());
            bd.setNextBusinessDate(LocalDate.now().plusDays(1));
            bd.setStatus("Open");
            return dateRepo.save(bd);
        });
    }

    private Map<String, Object> buildState(SystemBusinessDate bd) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("businessDate", bd.getBusinessDate());
        result.put("nextBusinessDate", bd.getNextBusinessDate());
        result.put("status", bd.getStatus());
        result.put("lastEodDate", bd.getLastEodDate());

        List<Map<String, Object>> runs = new ArrayList<>();
        for (EodRun run : runRepo.findAllByOrderByStartedAtDesc()) {
            runs.add(runMap(run, stepRepo.findByEodRunIdOrderByIdAsc(run.getId())));
        }
        result.put("eodRuns", runs);

        List<Map<String, Object>> branches = new ArrayList<>();
        for (BranchCob cob : cobRepo.findByBusinessDateOrderByIdAsc(bd.getBusinessDate())) {
            branches.add(cobMap(cob));
        }
        result.put("branches", branches);
        return result;
    }

    private Map<String, Object> cobMap(BranchCob cob) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(cob.getId()));
        map.put("branchId", cob.getBranchId() == null ? null : String.valueOf(cob.getBranchId()));
        map.put("branch", cob.getBranch());
        map.put("businessDate", cob.getBusinessDate());
        map.put("status", cob.getStatus());
        map.put("closedBy", cob.getClosedBy());
        map.put("closedAt", cob.getClosedAt());
        return map;
    }

    private Map<String, Object> runMap(EodRun run, List<EodStep> steps) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(run.getId()));
        map.put("businessDate", run.getBusinessDate());
        map.put("status", run.getStatus());
        map.put("startedAt", run.getStartedAt());
        map.put("completedAt", run.getCompletedAt());
        map.put("startedBy", run.getStartedBy());
        List<Map<String, Object>> stepMaps = new ArrayList<>();
        for (EodStep step : steps) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("key", step.getKey());
            s.put("name", step.getName());
            s.put("status", step.getStatus());
            s.put("processed", step.getProcessed());
            s.put("message", step.getMessage());
            stepMaps.add(s);
        }
        map.put("steps", stepMaps);
        return map;
    }

    private static Long longVal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(value.toString());
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }
}
