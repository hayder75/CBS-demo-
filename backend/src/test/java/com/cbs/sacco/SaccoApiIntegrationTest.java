package com.cbs.sacco;

import com.cbs.sacco.approval.entity.Approval;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SaccoApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApprovalRepository approvalRepository;

    @BeforeEach
    void resetApproval() {
        Approval approval = approvalRepository.findById(1L).orElseThrow();
        approval.setStatus("Pending");
        approval.setApprovedBy(null);
        approval.setDecidedAt(null);
        approvalRepository.save(approval);
    }

    private String loginToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"MANAGER\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    @Test
    void loginReturnsUserAndToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"manager\",\"role\":\"MANAGER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("manager"))
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void roleLoginResolvesDemoUser() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TELLER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TELLER"));
    }

    @Test
    void membersListRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/members")).andExpect(status().isUnauthorized());
    }

    @Test
    void membersListReturnsSeededMembers() throws Exception {
        String token = loginToken();
        mockMvc.perform(get("/api/members").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").isNotEmpty())
                .andExpect(jsonPath("$[0].nextOfKin").isArray())
                .andExpect(jsonPath("$[0].beneficiaries").isArray());
    }

    @Test
    void kpiReturnsDashboardMetrics() throws Exception {
        String token = loginToken();
        mockMvc.perform(get("/api/kpi").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMembers").isNumber())
                .andExpect(jsonPath("$.loanPortfolio").isNumber())
                .andExpect(jsonPath("$.approvalsPending").isNumber());
    }

    @Test
    void approvalsMakerCheckerBlocksSelfApproval() throws Exception {
        // Login as the initiator of approval id 1 (Biruk Kebede)
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"credit\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String creditToken = objectMapper.readTree(login.getResponse().getContentAsString()).get("token").asText();

        // Initiated by Biruk Kebede -> self-approval must be rejected
        mockMvc.perform(post("/api/approvals/1/approve")
                        .header("Authorization", "Bearer " + creditToken))
                .andExpect(status().isConflict());

        // Manager can approve
        String managerToken = loginToken();
        mockMvc.perform(post("/api/approvals/1/approve")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Approved"));
    }

    @Test
    void checkOffUploadCreatesReconciledBatch() throws Exception {
        String token = loginToken();
        mockMvc.perform(post("/api/checkoff/upload")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"employer\":\"Ministry of Education\",\"month\":\"Sep 2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Reconciled"))
                .andExpect(jsonPath("$.rows").value(87));
    }
}