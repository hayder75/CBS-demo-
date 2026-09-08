package com.cbs.sacco;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Reusable base for API integration tests. Extend this class and add @TestMethodOrder
 * where test ordering matters. Provides JWT login, JSON helpers, and contract assertions.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class BaseApiIT {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected String loginToken(String username) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\"}"))
                .andReturn();
        assertEquals(200, result.getResponse().getStatus(), "login as " + username);
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.path("token").asText();
    }

    protected String loginTokenByRole(String role) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"" + role + "\"}"))
                .andReturn();
        assertEquals(200, result.getResponse().getStatus(), "role login " + role);
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.path("token").asText();
    }

    protected JsonNode get(String path, String token) throws Exception {
        return get(path, token, 200);
    }

    protected JsonNode get(String path, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get(path).header("Authorization", "Bearer " + token))
                .andReturn();
        assertEquals(expectedStatus, result.getResponse().getStatus(),
                "GET " + path + " -> expected " + expectedStatus + " got " + result.getResponse().getStatus()
                        + " body=" + result.getResponse().getContentAsString());
        String content = result.getResponse().getContentAsString();
        return content.isEmpty() ? null : objectMapper.readTree(content);
    }

    protected JsonNode post(String path, Object body, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        assertEquals(expectedStatus, result.getResponse().getStatus(),
                "POST " + path + " -> expected " + expectedStatus + " got " + result.getResponse().getStatus()
                        + " body=" + result.getResponse().getContentAsString());
        String content = result.getResponse().getContentAsString();
        return content.isEmpty() ? null : objectMapper.readTree(content);
    }

    protected void assertHasFields(JsonNode node, String... fields) {
        for (String f : fields) {
            assertTrue(node.has(f), "missing field '" + f + "' in " + node.toString());
        }
    }

    protected void assertArrayFields(ArrayNode arr, int minSize, String... fields) {
        assertTrue(arr.size() >= minSize, "array smaller than " + minSize + ": " + arr.size());
        if (arr.size() > 0) {
            assertHasFields(arr.get(0), fields);
        }
    }

    protected void assertTypes(JsonNode node, Map<String, Class<?>> fieldTypes) {
        fieldTypes.forEach((f, t) -> {
            JsonNode v = node.get(f);
            assertTrue(v != null && !v.isNull(), "field '" + f + "' is missing/null");
            if (t == String.class) assertTrue(v.isTextual(), f + " not textual");
            else if (t == Integer.class) assertTrue(v.isNumber(), f + " not a number");
            else if (t == Boolean.class) assertTrue(v.isBoolean(), f + " not boolean");
            else if (t == ArrayNode.class) assertTrue(v.isArray(), f + " not an array");
            else fail("unsupported type assertion: " + t);
        });
    }
}