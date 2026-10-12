package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Gap-closure tests: KYC views/import, document attachments, admin messages.
 */
class AppGapsIT extends BaseApiIT {

    private static final String SFX = Long.toString(System.currentTimeMillis() % 100000);

    private String token() throws Exception {
        return loginToken("manager");
    }

    @Test
    @DisplayName("GET /api/members/kyc/summary returns KYC counts")
    void kycSummary() throws Exception {
        JsonNode n = get("/api/members/kyc/summary", token());
        assertHasFields(n, "total", "pending", "verified", "emptyPhoto", "withoutSignature");
        assertTrue(n.get("total").asInt() > 0);
    }

    @Test
    @DisplayName("GET /api/members/kyc filters by KYC category")
    void kycFilters() throws Exception {
        JsonNode emptyPhoto = get("/api/members/kyc?filter=empty-photo", token());
        assertTrue(emptyPhoto.isArray());
        emptyPhoto.forEach(m -> assertFalse(m.get("hasPhoto").asBoolean(), "filtered member must lack a photo"));

        JsonNode waiting = get("/api/members/kyc?filter=kyc-waiting", token());
        assertTrue(waiting.isArray());
    }

    @Test
    @DisplayName("POST /api/members/import bulk-creates members")
    void importMembers() throws Exception {
        JsonNode res = post("/api/members/import",
                Map.of("rows", List.of(
                        Map.of("fullName", "Import One " + SFX, "gender", "F", "phone", "+251 91 000 0001"),
                        Map.of("fullName", "Import Two " + SFX, "gender", "M"))),
                token(), 200);
        assertHasFields(res, "created", "total");
        assertEquals(2, res.get("created").asInt());

        post("/api/members/import", Map.of("rows", "not-an-array"), token(), 400);
    }

    @Test
    @DisplayName("document attachments can be created, listed by entity and deleted")
    void documentAttachments() throws Exception {
        JsonNode docs = get("/api/documents", token());
        long typeId = docs.get(0).get("id").asLong();

        JsonNode created = post("/api/documents/attachments",
                Map.of("documentTypeId", typeId, "entityType", "Customer", "entityId", "MEM-" + SFX,
                        "fileName", "id-copy.pdf", "sizeKb", 240),
                token(), 200);
        assertHasFields(created, "id", "documentTypeId", "entityType", "entityId", "fileName", "status");

        JsonNode listed = get("/api/documents/attachments?entityType=Customer&entityId=MEM-" + SFX, token());
        assertTrue(listed.isArray() && listed.size() >= 1);

        post("/api/documents/attachments",
                Map.of("documentTypeId", 999999, "entityType", "Customer", "entityId", "X", "fileName", "x.pdf"),
                token(), 404);

        long id = created.get("id").asLong();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/documents/attachments/" + id)
                        .header("Authorization", "Bearer " + token()))
                .andReturn();
    }

    @Test
    @DisplayName("admin messages can be created, sent and listed")
    void messages() throws Exception {
        JsonNode seeded = get("/api/messages", token());
        assertTrue(seeded.isArray() && seeded.size() >= 2);
        assertHasFields(seeded.get(0), "id", "title", "category", "audience", "channel", "status");

        JsonNode draft = post("/api/messages",
                Map.of("title", "Test message " + SFX, "body", "Hello", "audience", "MANAGER"), token(), 200);
        assertEquals("Draft", draft.get("status").asText());

        JsonNode sent = post("/api/messages/" + draft.get("id").asLong() + "/send", Map.of(), token(), 200);
        assertEquals("Sent", sent.get("status").asText());

        JsonNode sentOnly = get("/api/messages?status=Sent", token());
        sentOnly.forEach(m -> assertEquals("Sent", m.get("status").asText()));
    }
}
