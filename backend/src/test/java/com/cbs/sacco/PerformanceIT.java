package com.cbs.sacco;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real-HTTP performance and concurrency checks against a random-port server.
 * Latency is measured per endpoint (warmup + N samples) and asserted against a
 * generous threshold so it is meaningful on CI as well as this dev box.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PerformanceIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ApprovalRepository approvalRepository;

    private String base;

    @BeforeEach
    void setUp() {
        base = "http://localhost:" + port;
    }

    private String login(String role) {
        ResponseEntity<Map> resp = rest.postForEntity(base + "/api/auth/login",
                Map.of("role", role), Map.class);
        assertEquals(200, resp.getStatusCode().value());
        return (String) resp.getBody().get("token");
    }

    private ResponseEntity<String> get(String path, String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return rest.exchange(base + path, HttpMethod.GET, new HttpEntity<>(h), String.class);
    }

    private ResponseEntity<String> post(String path, Object body, String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        h.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(base + path, HttpMethod.POST,
                new HttpEntity<>(body, h), String.class);
    }

    @Test
    @DisplayName("Endpoint latency: warmup + 20 samples, avg < 800ms, p95 < 1500ms")
    void endpointLatency() throws Exception {
        String token = login("MANAGER");
        List<String> paths = List.of(
                "/api/members", "/api/loans", "/api/kpi", "/api/savings/products",
                "/api/accounting/accounts", "/api/accounting/journal", "/api/checkoff",
                "/api/collateral", "/api/shares/transfers", "/api/shares/dividends",
                "/api/cashops/tills", "/api/cashops/movements", "/api/cashops/pettycash",
                "/api/approvals", "/api/notifications", "/api/auth/users",
                "/api/portfolio-at-risk", "/api/savings-trend", "/api/loan-product-mix");

        // warmup
        for (String p : paths) get(p, token);

        for (String p : paths) {
            long[] samples = new long[20];
            for (int i = 0; i < samples.length; i++) {
                long t0 = System.nanoTime();
                assertEquals(200, get(p, token).getStatusCode().value(), p);
                samples[i] = (System.nanoTime() - t0) / 1_000_000;
            }
            Arrays.sort(samples);
            double avg = Arrays.stream(samples).average().orElse(0);
            long p95 = samples[(int) (samples.length * 0.95) - 1];
            long max = samples[samples.length - 1];
            System.out.printf("[PERF] %-34s avg=%6.1fms p95=%5dms max=%5dms%n", p, avg, p95, max);
            assertTrue(avg < 800, p + " avg too high: " + avg);
            assertTrue(p95 < 1500, p + " p95 too high: " + p95);
        }
    }

    @Test
    @DisplayName("Member detail latency across all seeded members")
    void memberDetailLatency() throws Exception {
        String token = login("MANAGER");
        get("/api/members/1", token); // warmup
        long[] samples = new long[20];
        for (int i = 0; i < 20; i++) {
            long t0 = System.nanoTime();
            assertEquals(200, get("/api/members/" + (i + 1), token).getStatusCode().value());
            samples[i] = (System.nanoTime() - t0) / 1_000_000;
        }
        Arrays.sort(samples);
        double avg = Arrays.stream(samples).average().orElse(0);
        System.out.printf("[PERF] member-detail avg=%.1fms p95=%dms%n", avg, samples[15]);
        assertTrue(avg < 800);
    }

    @Test
    @DisplayName("Login latency (20 samples)")
    void loginLatency() throws Exception {
        for (int i = 0; i < 3; i++) login("MANAGER"); // warmup
        long[] samples = new long[20];
        for (int i = 0; i < 20; i++) {
            long t0 = System.nanoTime();
            login("MANAGER");
            samples[i] = (System.nanoTime() - t0) / 1_000_000;
        }
        Arrays.sort(samples);
        double avg = Arrays.stream(samples).average().orElse(0);
        System.out.printf("[PERF] login avg=%.1fms p95=%dms%n", avg, samples[15]);
        assertTrue(avg < 1500, "login avg too high: " + avg);
    }

    @Test
    @DisplayName("Concurrent approvals: exactly one decision wins the race")
    void concurrentApprovalRace() throws Exception {
        Approval approval = approvalRepository.findById(2L).orElseThrow();
        approval.setStatus("Pending");
        approval.setApprovedBy(null);
        approval.setDecidedAt(null);
        approvalRepository.save(approval);

        String[] roles = {"TELLER", "TELLER", "ACCOUNTANT", "AUDITOR", "ADMIN", "MANAGER"};
        int threads = roles.length;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger ok200 = new AtomicInteger();
        AtomicInteger ok409 = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        List<String> tokens = new ArrayList<>();
        for (String role : roles) tokens.add(login(role));

        for (String token : tokens) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    go.await(5, TimeUnit.SECONDS);
                    int status = post("/api/approvals/2/approve", Map.of(), token).getStatusCode().value();
                    if (status == 200) ok200.incrementAndGet();
                    else if (status == 409) ok409.incrementAndGet();
                    else other.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return null;
            });
        }
        ready.await(5, TimeUnit.SECONDS);
        go.countDown();
        pool.shutdown();
        assertTrue(pool.awaitTermination(20, TimeUnit.SECONDS), "race timed out");

        System.out.printf("[PERF] approval race: 200=%d 409=%d other=%d%n", ok200.get(), ok409.get(), other.get());
        assertEquals(1, ok200.get(), "exactly one approver should win");
        assertEquals(threads - 1, ok409.get(), "the rest must be conflicts (409)");
        assertEquals(0, other.get());
    }
}