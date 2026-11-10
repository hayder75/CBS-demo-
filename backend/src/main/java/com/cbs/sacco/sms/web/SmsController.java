package com.cbs.sacco.sms.web;

import com.cbs.sacco.sms.entity.SmsLog;
import com.cbs.sacco.sms.service.SmsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
public class SmsController {

    private final SmsService smsService;

    public SmsController(SmsService smsService) {
        this.smsService = smsService;
    }

    public record SendOtpRequest(String phone, String purpose) {}
    public record VerifyOtpRequest(String phone, String code) {}
    public record SendSmsRequest(String phone, String message) {}

    @GetMapping("/status")
    public Map<String, Object> status() {
        return smsService.status();
    }

    @PostMapping("/otp/send")
    public Map<String, Object> sendOtp(@RequestBody SendOtpRequest request) {
        return smsService.sendOtp(request.phone(), request.purpose());
    }

    @PostMapping("/otp/verify")
    public Map<String, Object> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return smsService.verifyOtp(request.phone(), request.code());
    }

    @PostMapping("/send")
    public Map<String, Object> sendSms(@RequestBody SendSmsRequest request) {
        return smsService.sendSms(request.phone(), request.message());
    }

    @GetMapping("/logs")
    public List<SmsLog> logs() {
        return smsService.recent();
    }
}
