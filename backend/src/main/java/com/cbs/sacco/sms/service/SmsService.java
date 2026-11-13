package com.cbs.sacco.sms.service;

import com.cbs.sacco.sms.client.AfroSmsClient;
import com.cbs.sacco.sms.config.AfroSmsProperties;
import com.cbs.sacco.sms.entity.SmsLog;
import com.cbs.sacco.sms.entity.SmsOtpChallenge;
import com.cbs.sacco.sms.repo.SmsLogRepository;
import com.cbs.sacco.sms.repo.SmsOtpChallengeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.regex.Pattern;

@Service
public class SmsService {

    private static final Pattern ETHIOPIAN_MOBILE = Pattern.compile("^\\+251[79]\\d{8}$");

    private final AfroSmsProperties props;
    private final AfroSmsClient client;
    private final SmsOtpChallengeRepository challengeRepo;
    private final SmsLogRepository logRepo;
    private final Map<String, Deque<Instant>> sendWindows = new ConcurrentHashMap<>();

    public SmsService(
            AfroSmsProperties props,
            AfroSmsClient client,
            SmsOtpChallengeRepository challengeRepo,
            SmsLogRepository logRepo) {
        this.props = props;
        this.client = client;
        this.challengeRepo = challengeRepo;
        this.logRepo = logRepo;
    }

    public Map<String, Object> status() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("enabled", props.configured());
        result.put("provider", "Afro SMS");
        result.put("sender", props.getSender());
        result.put("from", mask(props.getFrom()));
        result.put("otpLength", props.getOtpLength());
        result.put("otpTtlSeconds", props.getOtpTtlSeconds());
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> sendOtp(String rawPhone, String purpose) {
        String phone = normalize(rawPhone);
        if (!props.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS gateway is not configured");
        }
        enforceRateLimit(phone);
        try {
            Map<String, Object> response = client.challenge(phone);
            String vc = extractVc(response);
            if (!success(response) || vc == null) {
                record(phone, "OTP", "Failed", failureDetail(response));
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "SMS gateway rejected the OTP request");
            }
            Instant now = Instant.now();
            findPending(phone).ifPresent(previous -> {
                previous.setStatus("Superseded");
                challengeRepo.save(previous);
            });
            SmsOtpChallenge challenge = new SmsOtpChallenge();
            challenge.setPhone(phone);
            challenge.setPurpose(purpose == null || purpose.isBlank() ? "Registration" : purpose);
            challenge.setVc(vc);
            challenge.setStatus("Pending");
            challenge.setAttempts(0);
            challenge.setCreatedAt(now);
            challenge.setExpiresAt(now.plusSeconds(props.getOtpTtlSeconds()));
            challengeRepo.save(challenge);
            record(phone, "OTP", "Sent", "OTP challenge sent");
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("sent", true);
            result.put("phone", phone);
            result.put("expiresIn", props.getOtpTtlSeconds());
            return result;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            record(phone, "OTP", "Failed", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the SMS gateway");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> verifyOtp(String rawPhone, String code) {
        String phone = normalize(rawPhone);
        if (code == null || !code.matches("\\d{4,8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter the code sent to your phone");
        }
        SmsOtpChallenge challenge = findPending(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request a new code"));
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            challenge.setStatus("Expired");
            challengeRepo.save(challenge);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That code has expired. Request a new one.");
        }
        if (challenge.getAttempts() >= props.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Request a new code.");
        }
        boolean verified;
        try {
            verified = success(client.verify(phone, challenge.getVc(), code));
        } catch (Exception ex) {
            record(phone, "Verify", "Failed", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the SMS gateway");
        }
        if (!verified) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            challengeRepo.save(challenge);
            record(phone, "Verify", "Failed", "Invalid code");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That code is incorrect or has expired");
        }
        challenge.setStatus("Verified");
        challenge.setVerifiedAt(Instant.now());
        challengeRepo.save(challenge);
        record(phone, "Verify", "Verified", "Phone verified");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("verified", true);
        result.put("phone", phone);
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> sendSms(String rawPhone, String message) {
        String phone = normalize(rawPhone);
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }
        if (!props.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS gateway is not configured");
        }
        try {
            Map<String, Object> response = client.sendSms(phone, message.trim());
            boolean ok = success(response);
            record(phone, "SMS", ok ? "Sent" : "Failed", ok ? "Message sent" : failureDetail(response));
            if (!ok) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "SMS gateway rejected the message");
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("sent", true);
            result.put("phone", phone);
            return result;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            record(phone, "SMS", "Failed", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the SMS gateway");
        }
    }

    public java.util.List<SmsLog> recent() {
        return logRepo.findTop50ByOrderByIdDesc();
    }

    private Optional<SmsOtpChallenge> findPending(String phone) {
        return challengeRepo.findByStatusOrderByIdDesc("Pending").stream()
                .filter(challenge -> normalize(challenge.getPhone()).equals(phone))
                .findFirst();
    }

    private void enforceRateLimit(String phone) {
        Instant now = Instant.now();
        Deque<Instant> window = sendWindows.computeIfAbsent(phone, key -> new ConcurrentLinkedDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && window.peekFirst().isBefore(now.minusSeconds(3600))) {
                window.pollFirst();
            }
            if (!window.isEmpty() && window.peekLast().isAfter(now.minusSeconds(props.getResendSeconds()))) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code");
            }
            if (window.size() >= props.getMaxPerHour()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many OTP requests for this number");
            }
            window.addLast(now);
        }
    }

    private String normalize(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        String digits = rawPhone.replaceAll("[^0-9+]", "");
        String phone;
        if (digits.startsWith("+251")) {
            phone = digits;
        } else if (digits.startsWith("251")) {
            phone = "+" + digits;
        } else if (digits.startsWith("0")) {
            phone = "+251" + digits.substring(1);
        } else if (digits.length() == 9) {
            phone = "+251" + digits;
        } else {
            phone = digits;
        }
        if (!ETHIOPIAN_MOBILE.matcher(phone).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid Ethiopian mobile number");
        }
        return phone;
    }

    private void record(String phone, String purpose, String status, String detail) {
        SmsLog log = new SmsLog();
        log.setPhone(phone);
        log.setPurpose(purpose);
        log.setStatus(status);
        log.setDetail(detail == null ? null : detail.substring(0, Math.min(detail.length(), 240)));
        log.setCreatedAt(Instant.now());
        logRepo.save(log);
    }

    private static boolean success(Map<String, Object> body) {
        Object ack = body.get("acknowledge");
        if (ack != null) {
            return "success".equalsIgnoreCase(String.valueOf(ack));
        }
        Object response = body.get("response");
        if (response instanceof Map<?, ?> map) {
            Object code = map.get("code");
            if (code != null) {
                return String.valueOf(code).startsWith("2");
            }
        }
        return true;
    }

    private static String extractVc(Map<String, Object> body) {
        Object direct = body.get("vc");
        if (direct != null) return String.valueOf(direct);
        Object response = body.get("response");
        if (response instanceof Map<?, ?> map) {
            Object vc = map.get("vc");
            if (vc != null) return String.valueOf(vc);
            Object id = map.get("verificationId");
            if (id != null) return String.valueOf(id);
        }
        return null;
    }

    private static String failureDetail(Map<String, Object> body) {
        Object response = body.get("response");
        if (response instanceof Map<?, ?> map) {
            Object errors = map.get("errors");
            if (errors instanceof List<?> list && !list.isEmpty()) {
                return String.valueOf(list.get(0));
            }
            Object message = map.get("message");
            if (message != null) return String.valueOf(message);
        }
        Object message = body.get("message");
        if (message != null) return String.valueOf(message);
        Object error = body.get("error");
        if (error != null) return String.valueOf(error);
        return "Gateway rejected the request";
    }

    private static String mask(String value) {
        if (value == null || value.length() < 6) return value == null ? "" : "***";
        return value.substring(0, 4) + "…" + value.substring(value.length() - 4);
    }
}
