package com.cbs.sacco.memberlifecycle.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.memberlifecycle.entity.DormancyPolicy;
import com.cbs.sacco.memberlifecycle.entity.MemberCustomField;
import com.cbs.sacco.memberlifecycle.entity.MemberCustomValue;
import com.cbs.sacco.memberlifecycle.entity.MemberExitChecklist;
import com.cbs.sacco.memberlifecycle.entity.MemberExitRequest;
import com.cbs.sacco.memberlifecycle.repo.DormancyPolicyRepository;
import com.cbs.sacco.memberlifecycle.repo.MemberCustomFieldRepository;
import com.cbs.sacco.memberlifecycle.repo.MemberCustomValueRepository;
import com.cbs.sacco.memberlifecycle.repo.MemberExitRequestRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MemberLifecycleController {

    private static final List<String> FIELD_TYPES = List.of("Text", "Number", "Date", "Select", "Boolean");
    private static final List<String> APPLIES_TO = List.of("Individual", "Entity", "Both");
    private static final List<String> OPEN_STATUSES = List.of("Pending", "Approved");
    private static final String[][] EXIT_CHECKLIST = new String[][] {
            { "savings_withdrawn", "Savings withdrawn" },
            { "loans_settled", "Loans fully settled" },
            { "shares_transferred", "Shares transferred" },
            { "collateral_released", "Collateral released" },
            { "guarantor_cleared", "Guarantor exposure cleared" },
            { "kyc_retained", "KYC retained" }
    };

    private final MemberCustomFieldRepository fieldRepository;
    private final MemberCustomValueRepository valueRepository;
    private final MemberExitRequestRepository exitRepository;
    private final DormancyPolicyRepository policyRepository;
    private final MemberRepository memberRepository;

    public MemberLifecycleController(
            MemberCustomFieldRepository fieldRepository,
            MemberCustomValueRepository valueRepository,
            MemberExitRequestRepository exitRepository,
            DormancyPolicyRepository policyRepository,
            MemberRepository memberRepository) {
        this.fieldRepository = fieldRepository;
        this.valueRepository = valueRepository;
        this.exitRepository = exitRepository;
        this.policyRepository = policyRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping("/member-custom-fields")
    public List<MemberCustomField> listFields() {
        return fieldRepository.findAllByOrderByIdAsc();
    }

    @PostMapping("/member-custom-fields")
    public MemberCustomField createField(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        String key = text(payload.get("key"));
        String label = text(payload.get("label"));
        String type = text(payload.get("type"));
        String appliesTo = text(payload.get("appliesTo"));

        if (key.isEmpty()) throw new IllegalArgumentException("Key is required");
        if (label.isEmpty()) throw new IllegalArgumentException("Label is required");
        if (!FIELD_TYPES.contains(type)) {
            throw new IllegalArgumentException("Invalid field type: " + (type.isEmpty() ? "(empty)" : type));
        }
        if (appliesTo.isEmpty()) appliesTo = "Both";
        if (!APPLIES_TO.contains(appliesTo)) {
            throw new IllegalArgumentException("Invalid appliesTo value: " + appliesTo);
        }
        if (fieldRepository.existsByKeyIgnoreCase(key)) {
            throw new IllegalArgumentException("A custom field with key \"" + key + "\" already exists");
        }

        String options = null;
        if ("Select".equals(type)) {
            Object rawOptions = payload.get("options");
            if (!(rawOptions instanceof List<?> list)) {
                throw new IllegalArgumentException("Select fields require at least one option");
            }
            List<String> cleaned = new ArrayList<>();
            for (Object option : list) {
                String value = text(option);
                if (!value.isEmpty() && !cleaned.contains(value)) cleaned.add(value);
            }
            if (cleaned.isEmpty()) {
                throw new IllegalArgumentException("Select fields require at least one option");
            }
            options = String.join(",", cleaned);
        }

        MemberCustomField field = new MemberCustomField();
        field.setKey(key);
        field.setLabel(label);
        field.setType(type);
        field.setAppliesTo(appliesTo);
        field.setRequired(bool(payload, "required", false));
        field.setOptionsCsv(options);
        field.setStatus("Active");
        field.setCreatedAt(Instant.now());
        return fieldRepository.save(field);
    }

    @PostMapping("/member-custom-fields/{id}/toggle")
    public MemberCustomField toggleField(@PathVariable String id) {
        MemberCustomField field = fieldRepository.findById(ref(id))
                .orElseThrow(() -> new IllegalArgumentException("Custom field not found"));
        field.setStatus("Active".equals(field.getStatus()) ? "Inactive" : "Active");
        return fieldRepository.save(field);
    }

    @GetMapping("/members/{id}/custom-values")
    public List<MemberCustomValue> listValues(@PathVariable String id) {
        return valueRepository.findByMemberIdOrderByIdAsc(ref(id));
    }

    @Transactional
    @PostMapping("/members/{id}/custom-values")
    public List<MemberCustomValue> saveValues(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        Long memberId = ref(id);
        if (!memberRepository.existsById(memberId)) {
            throw new IllegalArgumentException("Member not found: " + id);
        }
        Map<String, Object> payload = body == null ? Map.of() : body;
        Object rawValues = payload.get("values");
        if (!(rawValues instanceof List<?> entries)) {
            throw new IllegalArgumentException("values must be an array");
        }

        Map<Long, String> submitted = new LinkedHashMap<>();
        List<MemberCustomField> fields = fieldRepository.findAllByOrderByIdAsc();
        Map<Long, MemberCustomField> fieldsById = new LinkedHashMap<>();
        for (MemberCustomField field : fields) fieldsById.put(field.getId(), field);

        for (Object raw : entries) {
            if (!(raw instanceof Map<?, ?> entry)) {
                throw new IllegalArgumentException("Each value must be an object");
            }
            Object rawFieldId = entry.get("fieldId");
            if (rawFieldId == null || text(rawFieldId).isEmpty()) {
                throw new IllegalArgumentException("fieldId is required");
            }
            Long fieldId = ref(rawFieldId);
            if (!fieldsById.containsKey(fieldId)) {
                throw new IllegalArgumentException("Unknown custom field: " + rawFieldId);
            }
            Object rawValue = entry.get("value");
            submitted.put(fieldId, rawValue == null ? "" : text(rawValue));
        }

        for (MemberCustomField field : fields) {
            if (!"Active".equals(field.getStatus()) || !Boolean.TRUE.equals(field.getRequired())) continue;
            String value = submitted.get(field.getId());
            if (value == null || value.isEmpty()) {
                throw new IllegalArgumentException(field.getLabel() + " is required");
            }
        }

        for (Map.Entry<Long, String> entry : submitted.entrySet()) {
            MemberCustomField field = fieldsById.get(entry.getKey());
            String value = entry.getValue();
            validateValue(field, value);
            if (value.isEmpty()) {
                valueRepository.findByMemberIdAndFieldId(memberId, field.getId())
                        .ifPresent(valueRepository::delete);
                continue;
            }
            MemberCustomValue row = valueRepository
                    .findByMemberIdAndFieldId(memberId, field.getId())
                    .orElseGet(MemberCustomValue::new);
            row.setMemberId(memberId);
            row.setFieldId(field.getId());
            row.setFieldKey(field.getKey());
            row.setLabel(field.getLabel());
            row.setType(field.getType());
            row.setValue(value);
            row.setUpdatedAt(Instant.now());
            valueRepository.save(row);
        }

        return valueRepository.findByMemberIdOrderByIdAsc(memberId);
    }

    @GetMapping("/member-exits")
    public List<MemberExitRequest> listExits() {
        return exitRepository.findAllByOrderByRequestedAtDesc();
    }

    @Transactional
    @PostMapping("/member-exits")
    public MemberExitRequest createExit(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        Long memberId = ref(payload.get("memberId"));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + payload.get("memberId")));
        if ("Withdrawn".equals(member.getStatus())) {
            throw new IllegalArgumentException("This member has already withdrawn");
        }
        if (exitRepository.existsByMemberIdAndStatusIn(memberId, OPEN_STATUSES)) {
            throw new IllegalArgumentException("An exit request is already open for this member");
        }
        String reason = text(payload.get("reason"));
        if (reason.isEmpty()) throw new IllegalArgumentException("Reason is required");

        MemberExitRequest request = new MemberExitRequest();
        request.setMemberId(memberId);
        request.setMemberName(member.getFullName());
        request.setMemberNo(member.getMemberNo());
        request.setReason(reason);
        request.setStatus("Pending");
        request.setRequestedAt(LocalDateTime.now());

        List<MemberExitChecklist> checklist = new ArrayList<>();
        for (int i = 0; i < EXIT_CHECKLIST.length; i++) {
            MemberExitChecklist item = new MemberExitChecklist();
            item.setKey(EXIT_CHECKLIST[i][0]);
            item.setLabel(EXIT_CHECKLIST[i][1]);
            item.setDone(false);
            item.setSortOrder(i);
            checklist.add(item);
        }
        request.setChecklist(checklist);
        return exitRepository.save(request);
    }

    @Transactional
    @PostMapping("/member-exits/{id}/checklist")
    public MemberExitRequest toggleChecklist(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        MemberExitRequest request = findExit(ref(id));
        if (!"Pending".equals(request.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending exit requests can be edited (current: " + request.getStatus() + ")");
        }
        Map<String, Object> payload = body == null ? Map.of() : body;
        String key = text(payload.get("key"));
        if (key.isEmpty()) throw new IllegalArgumentException("Checklist key is required");
        MemberExitChecklist item = request.getChecklist().stream()
                .filter(row -> key.equals(row.getKey()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown checklist item: " + key));
        if (!payload.containsKey("done") || payload.get("done") == null) {
            throw new IllegalArgumentException("done must be true or false");
        }
        item.setDone(bool(payload, "done", false));
        return exitRepository.save(request);
    }

    @Transactional
    @PostMapping("/member-exits/{id}/approve")
    public MemberExitRequest approveExit(@PathVariable String id) {
        MemberExitRequest request = findExit(ref(id));
        if (!"Pending".equals(request.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending exit requests can be approved (current: " + request.getStatus() + ")");
        }
        request.setStatus("Approved");
        request.setDecidedAt(LocalDateTime.now());
        return exitRepository.save(request);
    }

    @Transactional
    @PostMapping("/member-exits/{id}/complete")
    public MemberExitRequest completeExit(@PathVariable String id) {
        MemberExitRequest request = findExit(ref(id));
        if (!"Approved".equals(request.getStatus())) {
            throw new IllegalArgumentException(
                    "Only approved exit requests can be completed (current: " + request.getStatus() + ")");
        }
        if (request.getChecklist() == null || request.getChecklist().isEmpty()
                || request.getChecklist().stream().anyMatch(item -> !Boolean.TRUE.equals(item.getDone()))) {
            throw new IllegalArgumentException(
                    "All checklist items must be completed before the exit can be completed");
        }
        request.setStatus("Completed");
        request.setCompletedAt(LocalDateTime.now());
        if (request.getDecidedAt() == null) request.setDecidedAt(request.getCompletedAt());
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new NotFoundException("Member not found: " + request.getMemberId()));
        member.setStatus("Withdrawn");
        memberRepository.save(member);
        return exitRepository.save(request);
    }

    @Transactional
    @PostMapping("/member-exits/{id}/reject")
    public MemberExitRequest rejectExit(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        MemberExitRequest request = findExit(ref(id));
        if (!"Pending".equals(request.getStatus()) && !"Approved".equals(request.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending or approved exit requests can be rejected (current: " + request.getStatus() + ")");
        }
        request.setStatus("Rejected");
        request.setDecidedAt(LocalDateTime.now());
        return exitRepository.save(request);
    }

    @GetMapping("/dormancy/policy")
    public DormancyPolicy getPolicy() {
        return currentPolicy();
    }

    @PostMapping("/dormancy/policy")
    public DormancyPolicy savePolicy(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        DormancyPolicy policy = currentPolicy();
        Object rawMonths = payload.get("months");
        int months = rawMonths == null ? policy.getMonths() : integer(rawMonths, "months");
        if (months < 1 || months > 60) {
            throw new IllegalArgumentException("months must be an integer between 1 and 60");
        }
        policy.setMonths(months);
        policy.setAutoFlagMembers(bool(payload, "autoFlagMembers", Boolean.TRUE.equals(policy.getAutoFlagMembers())));
        policy.setAutoFlagAccounts(bool(payload, "autoFlagAccounts", Boolean.TRUE.equals(policy.getAutoFlagAccounts())));
        policy.setUpdatedAt(Instant.now());
        return policyRepository.save(policy);
    }

    @PostMapping("/dormancy/run")
    public Map<String, Object> runDormancy() {
        DormancyPolicy policy = currentPolicy();
        LocalDate cutoff = LocalDate.now().minusMonths(policy.getMonths());
        List<Member> active = memberRepository.findAll().stream()
                .filter(member -> "Active".equals(member.getStatus()))
                .toList();
        List<Map<String, Object>> candidates = new ArrayList<>();
        for (Member member : active) {
            if (member.getJoinDate() == null || !member.getJoinDate().isBefore(cutoff)) continue;
            BigDecimal outstanding = member.getLoanOutstanding() == null
                    ? BigDecimal.ZERO
                    : member.getLoanOutstanding();
            if (outstanding.signum() > 0) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("memberId", member.getId());
            row.put("memberName", member.getFullName());
            row.put("memberNo", member.getMemberNo());
            row.put("lastActivity", member.getJoinDate().toString());
            row.put("status", member.getStatus());
            row.put("savingsBalance", member.getSavingsBalance() == null ? BigDecimal.ZERO : member.getSavingsBalance());
            row.put("loanOutstanding", outstanding);
            candidates.add(row);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("flagged", candidates.size());
        result.put("skipped", Math.max(0, active.size() - candidates.size()));
        result.put("candidates", candidates);
        return result;
    }

    @Transactional
    @PostMapping("/dormancy/flag")
    public Map<String, Object> flagDormant(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        Object rawIds = payload.get("memberIds");
        if (!(rawIds instanceof List<?> ids)) {
            throw new IllegalArgumentException("memberIds must be an array");
        }
        int flagged = 0;
        for (Object raw : ids) {
            Long memberId = ref(raw);
            Member member = memberRepository.findById(memberId).orElse(null);
            if (member == null) continue;
            member.setStatus("Dormant");
            memberRepository.save(member);
            flagged++;
        }
        return Map.of("flagged", flagged);
    }

    @Transactional
    @PostMapping("/dormancy/reactivate")
    public Map<String, Object> reactivate(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        Long memberId = ref(payload.get("memberId"));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + payload.get("memberId")));
        member.setStatus("Active");
        memberRepository.save(member);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", member.getId());
        result.put("status", member.getStatus());
        return result;
    }

    private MemberExitRequest findExit(Long id) {
        return exitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exit request not found: " + id));
    }

    private DormancyPolicy currentPolicy() {
        return policyRepository.findById(1L).orElseGet(() -> {
            DormancyPolicy policy = new DormancyPolicy();
            policy.setId(1L);
            policy.setMonths(12);
            policy.setAutoFlagMembers(true);
            policy.setAutoFlagAccounts(true);
            policy.setUpdatedAt(Instant.now());
            return policyRepository.save(policy);
        });
    }

    private void validateValue(MemberCustomField field, String value) {
        if (value == null || value.isEmpty()) return;
        switch (field.getType()) {
            case "Number" -> {
                try {
                    new BigDecimal(value);
                } catch (NumberFormatException error) {
                    throw new IllegalArgumentException(field.getLabel() + " must be a valid number");
                }
            }
            case "Date" -> {
                try {
                    LocalDate.parse(value);
                } catch (RuntimeException dateError) {
                    try {
                        java.time.LocalDateTime.parse(value);
                    } catch (RuntimeException dateTimeError) {
                        try {
                            Instant.parse(value);
                        } catch (RuntimeException instantError) {
                            throw new IllegalArgumentException(field.getLabel() + " must be a valid date");
                        }
                    }
                }
            }
            case "Select" -> {
                if (!field.getOptionList().contains(value)) {
                    throw new IllegalArgumentException(field.getLabel() + " must be one of: "
                            + String.join(", ", field.getOptionList()));
                }
            }
            case "Boolean" -> {
                String normalized = value.toLowerCase(Locale.ROOT);
                if (!"true".equals(normalized) && !"false".equals(normalized)) {
                    throw new IllegalArgumentException(field.getLabel() + " must be true or false");
                }
            }
            default -> {
            }
        }
    }

    private static String text(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private static Long ref(Object value) {
        if (value == null) throw new IllegalArgumentException("Identifier is required");
        String raw = value.toString().trim();
        if (raw.isEmpty()) throw new IllegalArgumentException("Identifier is required");
        if (raw.matches("^[A-Za-z]\\d+$")) raw = raw.substring(1);
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Invalid identifier: " + value);
        }
    }

    private static int integer(Object value, String key) {
        try {
            if (value instanceof Number number) {
                double raw = number.doubleValue();
                if (raw != Math.rint(raw)) {
                    throw new IllegalArgumentException(key + " must be an integer");
                }
                return number.intValue();
            }
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException(key + " must be an integer");
        }
    }

    private static boolean bool(Map<String, Object> body, String key, boolean fallback) {
        Object value = body.get(key);
        if (value == null) return fallback;
        if (value instanceof Boolean flag) return flag;
        String text = value.toString().trim();
        if ("true".equalsIgnoreCase(text)) return true;
        if ("false".equalsIgnoreCase(text)) return false;
        throw new IllegalArgumentException(key + " must be a boolean");
    }
}
