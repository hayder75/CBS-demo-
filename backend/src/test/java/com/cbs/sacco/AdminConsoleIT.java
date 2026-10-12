package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 2 — administration console: holidays, user groups, device access, org profile, users.
 */
class AdminConsoleIT extends BaseApiIT {

    private static final String SFX = Long.toString(System.currentTimeMillis() % 100000);

    private String token() throws Exception {
        return loginToken("admin");
    }

    @Test
    @DisplayName("GET /api/holidays returns seeded holidays")
    void holidaysList() throws Exception {
        JsonNode n = get("/api/holidays", token());
        assertTrue(n.isArray() && n.size() >= 6, "expected seeded holidays");
        assertHasFields(n.get(0), "id", "name", "holidayDate", "recurring", "holidayType", "status");
    }

    @Test
    @DisplayName("POST /api/holidays creates and validates input")
    void holidayCreate() throws Exception {
        JsonNode created = post("/api/holidays",
                Map.of("name", "Founders Day", "holidayDate", "2027-03-01", "holidayType", "Internal"),
                token(), 200);
        assertHasFields(created, "id", "name", "holidayDate");
        assertEquals("Founders Day", created.get("name").asText());

        post("/api/holidays", Map.of("name", "Bad"), token(), 400);
    }

    @Test
    @DisplayName("GET /api/user-groups returns seeded groups with permissions")
    void userGroupsList() throws Exception {
        JsonNode n = get("/api/user-groups", token());
        assertTrue(n.isArray() && n.size() >= 8, "expected seeded groups");
        assertHasFields(n.get(0), "id", "name", "code", "maxLoginAttempts",
                "multipleMachineLogins", "branchSpecific", "multipleUsers", "permissions", "status");
    }

    @Test
    @DisplayName("POST /api/user-groups creates, rejects duplicates, supports verify")
    void userGroupCreate() throws Exception {
        String code = "TESTER_" + SFX;
        JsonNode created = post("/api/user-groups",
                Map.of("name", "Tester", "code", code, "maxLoginAttempts", 3,
                        "permissions", java.util.List.of("reports", "audit")),
                token(), 200);
        assertHasFields(created, "id", "code", "permissions");
        assertTrue(created.get("permissions").asText().contains("reports"));

        post("/api/user-groups", Map.of("name", "Dup", "code", code), token(), 400);

        long id = created.get("id").asLong();
        JsonNode verified = post("/api/user-groups/" + id + "/verify", Map.of(), token(), 200);
        assertEquals("Verified", verified.get("status").asText());
    }

    @Test
    @DisplayName("GET /api/device-accesses returns devices and supports authorize/block")
    void deviceAccess() throws Exception {
        JsonNode n = get("/api/device-accesses", token());
        assertTrue(n.isArray() && n.size() >= 4);
        assertHasFields(n.get(0), "id", "username", "deviceName", "authorized", "status");

        JsonNode blocked = n.get(0);
        long id = blocked.get("id").asLong();
        JsonNode auth = post("/api/device-accesses/" + id + "/authorize", Map.of(), token(), 200);
        assertEquals("Authorized", auth.get("status").asText());
        JsonNode blk = post("/api/device-accesses/" + id + "/block", Map.of(), token(), 200);
        assertEquals("Blocked", blk.get("status").asText());
    }

    @Test
    @DisplayName("GET/PUT /api/org-profile round-trips the organisation profile")
    void orgProfile() throws Exception {
        JsonNode n = get("/api/org-profile", token());
        assertHasFields(n, "id", "name", "currencyCode", "fiscalYearStart", "status");

        JsonNode updated = put("/api/org-profile", Map.of("city", "Adama", "phone", "+251 11 000 0000"),
                token(), 200);
        assertEquals("Adama", updated.get("city").asText());
        assertEquals("+251 11 000 0000", updated.get("phone").asText());
    }

    @Test
    @DisplayName("POST /api/auth/users creates a user and rejects duplicates")
    void createUser() throws Exception {
        String username = "jdoe_" + SFX;
        JsonNode created = post("/api/auth/users",
                Map.of("username", username, "name", "Jane Doe", "role", "TELLER", "branch", "Bole"),
                token(), 200);
        assertHasFields(created, "id", "username", "name", "role");
        assertEquals("TELLER", created.get("role").asText());

        post("/api/auth/users", Map.of("username", username, "name", "Dup", "role", "TELLER"), token(), 400);
        post("/api/auth/users", Map.of("username", "x_" + SFX, "name", "X", "role", "NOPE"), token(), 400);
    }
}
