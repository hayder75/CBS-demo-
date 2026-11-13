package com.cbs.sacco.referral.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.referral.entity.ReferralCode;
import com.cbs.sacco.referral.entity.ReferralRecord;
import com.cbs.sacco.referral.entity.ReferralSettings;
import com.cbs.sacco.referral.repo.ReferralCodeRepository;
import com.cbs.sacco.referral.repo.ReferralRecordRepository;
import com.cbs.sacco.referral.repo.ReferralSettingsRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/referrals")
public class ReferralController {

    private static final Pattern ETHIOPIAN_MOBILE = Pattern.compile("^\\+251[79]\\d{8}$");
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ReferralCodeRepository codeRepository;
    private final ReferralRecordRepository recordRepository;
    private final ReferralSettingsRepository settingsRepository;
    private final MemberRepository memberRepository;

    public ReferralController(
            ReferralCodeRepository codeRepository,
            ReferralRecordRepository recordRepository,
            ReferralSettingsRepository settingsRepository,
            MemberRepository memberRepository) {
        this.codeRepository = codeRepository;
        this.recordRepository = recordRepository;
        this.settingsRepository = settingsRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping("/codes")
    public List<ReferralCode> listCodes() {
        return codeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PostMapping("/codes")
    public ReferralCode createCode(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;

        Long memberId = longOf(payload, "memberId");
        Member member = memberId == null ? null : memberRepository.findById(memberId).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("Member not found: " + memberId);
        }
        if (codeRepository.existsByMemberIdAndStatus(member.getId(), "Active")) {
            throw new IllegalArgumentException("This member already has an active referral code");
        }

        BigDecimal rewardAmount = dec(payload, "rewardAmount");
        if (rewardAmount == null) {
            rewardAmount = currentSettings().getRewardPerReferral();
        }
        if (rewardAmount.signum() < 0) {
            throw new IllegalArgumentException("Reward amount cannot be negative");
        }

        ReferralCode code = new ReferralCode();
        code.setCode(generateCode());
        code.setMemberId(member.getId());
        code.setMemberName(member.getFullName());
        code.setStatus("Active");
        code.setUses(0);
        code.setRewardAmount(rewardAmount);
        code.setCreatedAt(Instant.now());
        return codeRepository.save(code);
    }

    @PostMapping("/codes/{id}/toggle")
    public ReferralCode toggleCode(@PathVariable Long id) {
        ReferralCode code = codeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Referral code not found: " + id));
        code.setStatus("Active".equals(code.getStatus()) ? "Disabled" : "Active");
        return codeRepository.save(code);
    }

    @GetMapping
    public List<ReferralRecord> list() {
        return recordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PostMapping
    public ReferralRecord create(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;

        String codeValue = str(payload, "code");
        if (codeValue == null || codeValue.isBlank()) {
            throw new IllegalArgumentException("Referral code is required");
        }
        ReferralCode code = codeRepository.findByCode(codeValue.trim().toUpperCase(Locale.ROOT))
                .orElse(null);
        if (code == null) {
            throw new IllegalArgumentException("Referral code not found: " + codeValue);
        }
        if (!"Active".equals(code.getStatus())) {
            throw new IllegalArgumentException("This referral code is disabled");
        }

        String refereeName = str(payload, "refereeName");
        if (refereeName == null || refereeName.isBlank()) {
            throw new IllegalArgumentException("Referee name is required");
        }

        String refereePhone = normalizePhone(str(payload, "refereePhone"));
        if (!ETHIOPIAN_MOBILE.matcher(refereePhone).matches()) {
            throw new IllegalArgumentException("Enter a valid Ethiopian mobile number (+251 7/9 xxxxxxxx)");
        }

        Member owner = memberRepository.findById(code.getMemberId()).orElse(null);
        if (owner != null && normalizePhone(owner.getPhone()).equals(refereePhone)) {
            throw new IllegalArgumentException("A member cannot refer themselves");
        }
        boolean alreadyReferred = recordRepository.findAll().stream()
                .anyMatch(record -> normalizePhone(record.getRefereePhone()).equals(refereePhone));
        if (alreadyReferred) {
            throw new IllegalArgumentException("This phone number has already been referred");
        }

        ReferralRecord record = new ReferralRecord();
        record.setCode(code.getCode());
        record.setReferrerName(code.getMemberName());
        record.setRefereeName(refereeName.trim());
        record.setRefereePhone(refereePhone);
        record.setStatus("Pending");
        record.setRewardAmount(code.getRewardAmount() == null ? BigDecimal.ZERO : code.getRewardAmount());
        record.setCreatedAt(Instant.now());

        code.setUses(code.getUses() == null ? 1 : code.getUses() + 1);
        codeRepository.save(code);
        return recordRepository.save(record);
    }

    @PostMapping("/{id}/qualify")
    public ReferralRecord qualify(@PathVariable Long id) {
        ReferralRecord record = findRecord(id);
        if (!"Pending".equals(record.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending referrals can be qualified (current: " + record.getStatus() + ")");
        }
        record.setStatus("Qualified");
        record.setQualifiedAt(Instant.now());
        return recordRepository.save(record);
    }

    @PostMapping("/{id}/reward")
    public ReferralRecord reward(@PathVariable Long id) {
        ReferralRecord record = findRecord(id);
        if (!"Qualified".equals(record.getStatus())) {
            throw new IllegalArgumentException(
                    "Only qualified referrals can be rewarded (current: " + record.getStatus() + ")");
        }
        ReferralSettings settings = currentSettings();
        if (!Boolean.TRUE.equals(settings.getEnabled())) {
            throw new IllegalArgumentException("Referral programme is disabled in settings");
        }
        if (record.getRewardAmount() == null || record.getRewardAmount().signum() == 0) {
            record.setRewardAmount(settings.getRewardPerReferral());
        }
        record.setStatus("Rewarded");
        record.setRewardedAt(Instant.now());
        return recordRepository.save(record);
    }

    @PostMapping("/{id}/reject")
    public ReferralRecord reject(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        ReferralRecord record = findRecord(id);
        if (!"Pending".equals(record.getStatus()) && !"Qualified".equals(record.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending or qualified referrals can be rejected (current: " + record.getStatus() + ")");
        }
        String note = body == null ? null : str(body, "note");
        record.setStatus("Rejected");
        if (note != null && !note.isBlank()) {
            record.setNote(note.trim());
        }
        return recordRepository.save(record);
    }

    @GetMapping("/settings")
    public ReferralSettings getSettings() {
        return currentSettings();
    }

    @PostMapping("/settings")
    public ReferralSettings saveSettings(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        ReferralSettings settings = currentSettings();

        BigDecimal reward = dec(payload, "rewardPerReferral");
        if (reward == null) {
            reward = settings.getRewardPerReferral();
        }
        if (reward.signum() < 0) {
            throw new IllegalArgumentException("Reward per referral cannot be negative");
        }

        BigDecimal minDeposit = dec(payload, "minQualifyingDeposit");
        if (minDeposit == null) {
            minDeposit = settings.getMinQualifyingDeposit();
        }
        if (minDeposit.signum() < 0) {
            throw new IllegalArgumentException("Minimum qualifying deposit cannot be negative");
        }

        String rewardMode = str(payload, "rewardMode");
        if (rewardMode == null || rewardMode.isBlank()) {
            rewardMode = settings.getRewardMode();
        }
        if (!"Cash".equals(rewardMode) && !"Savings".equals(rewardMode)) {
            throw new IllegalArgumentException("Reward mode must be Cash or Savings");
        }

        settings.setEnabled(bool(payload, "enabled", Boolean.TRUE.equals(settings.getEnabled())));
        settings.setRewardPerReferral(reward);
        settings.setMinQualifyingDeposit(minDeposit);
        settings.setRewardMode(rewardMode);
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    @GetMapping("/report")
    public Map<String, Object> report() {
        List<ReferralRecord> records = recordRepository.findAll();
        int total = records.size();
        int pending = 0;
        int qualified = 0;
        int rewarded = 0;
        int rejected = 0;
        BigDecimal rewardsPaid = BigDecimal.ZERO;
        Map<String, Map<String, Object>> referrers = new LinkedHashMap<>();

        for (ReferralRecord record : records) {
            switch (record.getStatus()) {
                case "Pending" -> pending++;
                case "Qualified" -> qualified++;
                case "Rewarded" -> {
                    rewarded++;
                    rewardsPaid = rewardsPaid.add(
                            record.getRewardAmount() == null ? BigDecimal.ZERO : record.getRewardAmount());
                }
                case "Rejected" -> rejected++;
                default -> {
                }
            }
            String name = record.getReferrerName() == null || record.getReferrerName().isBlank()
                    ? "Unassigned"
                    : record.getReferrerName();
            Map<String, Object> row = referrers.computeIfAbsent(name, key -> {
                Map<String, Object> created = new LinkedHashMap<>();
                created.put("memberName", key);
                created.put("referrals", 0);
                created.put("rewarded", 0);
                return created;
            });
            row.put("referrals", (int) row.get("referrals") + 1);
            if ("Rewarded".equals(record.getStatus())) {
                row.put("rewarded", (int) row.get("rewarded") + 1);
            }
        }

        List<Map<String, Object>> topReferrers = new ArrayList<>(referrers.values());
        topReferrers.sort((a, b) -> {
            int byReferrals = Integer.compare((int) b.get("referrals"), (int) a.get("referrals"));
            if (byReferrals != 0) return byReferrals;
            int byRewarded = Integer.compare((int) b.get("rewarded"), (int) a.get("rewarded"));
            if (byRewarded != 0) return byRewarded;
            return ((String) a.get("memberName")).compareTo((String) b.get("memberName"));
        });
        if (topReferrers.size() > 3) {
            topReferrers = new ArrayList<>(topReferrers.subList(0, 3));
        }

        double conversionPct = total == 0
                ? 0.0
                : BigDecimal.valueOf((qualified + rewarded) * 100.0 / total)
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalReferrals", total);
        report.put("pending", pending);
        report.put("qualified", qualified);
        report.put("rewarded", rewarded);
        report.put("rejected", rejected);
        report.put("conversionPct", conversionPct);
        report.put("rewardsPaid", rewardsPaid);
        report.put("topReferrers", topReferrers);
        return report;
    }

    private ReferralRecord findRecord(Long id) {
        return recordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Referral not found: " + id));
    }

    private ReferralSettings currentSettings() {
        return settingsRepository.findById(1L).orElseGet(() -> {
            ReferralSettings settings = new ReferralSettings();
            settings.setId(1L);
            settings.setEnabled(true);
            settings.setRewardPerReferral(new BigDecimal("100"));
            settings.setMinQualifyingDeposit(new BigDecimal("500"));
            settings.setRewardMode("Savings");
            settings.setUpdatedAt(Instant.now());
            return settingsRepository.save(settings);
        });
    }

    private String generateCode() {
        String candidate;
        do {
            StringBuilder builder = new StringBuilder("REF-");
            for (int i = 0; i < 6; i++) {
                builder.append(CODE_ALPHABET.charAt(
                        ThreadLocalRandom.current().nextInt(CODE_ALPHABET.length())));
            }
            candidate = builder.toString();
        } while (codeRepository.existsByCode(candidate));
        return candidate;
    }

    private static String normalizePhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+251")) return digits;
        if (digits.startsWith("251")) return "+" + digits;
        if (digits.startsWith("0")) return "+251" + digits.substring(1);
        if (digits.length() == 9) return "+251" + digits;
        return digits;
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private static BigDecimal dec(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) return null;
        try {
            return value instanceof Number number
                    ? new BigDecimal(number.toString())
                    : new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static Long longOf(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) return null;
        try {
            return value instanceof Number number ? number.longValue() : Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static boolean bool(Map<String, Object> body, String key, boolean fallback) {
        Object value = body.get(key);
        if (value == null) return fallback;
        if (value instanceof Boolean flag) return flag;
        String text = value.toString();
        if ("true".equalsIgnoreCase(text)) return true;
        if ("false".equalsIgnoreCase(text)) return false;
        throw new IllegalArgumentException(key + " must be a boolean");
    }
}
