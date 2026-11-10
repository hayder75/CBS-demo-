package com.cbs.sacco.auth.web;

import com.cbs.sacco.auth.dto.AuthResponse;
import com.cbs.sacco.auth.dto.LoginRequest;
import com.cbs.sacco.auth.dto.UserDto;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.auth.service.AuthService;
import com.cbs.sacco.auth.service.MfaRequiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            UserDto user = authService.login(request);
            return ResponseEntity.ok(AuthResponse.of(user, issue(user)));
        } catch (MfaRequiredException ex) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                    "mfaRequired", true,
                    "username", ex.getUsername(),
                    "message", "Enter the verification code sent to your phone"));
        }
    }

    @PostMapping("/login/verify")
    public AuthResponse verifyMfa(@RequestBody Map<String, Object> body) {
        String username = body.get("username") == null ? null : body.get("username").toString();
        String otp = body.get("otp") == null ? null : body.get("otp").toString();
        UserDto user = authService.verifyMfa(username, otp);
        return AuthResponse.of(user, issue(user));
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return principal == null ? null : authService.current(principal);
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return authService.listUsers();
    }

    @PostMapping("/users")
    public UserDto createUser(@RequestBody Map<String, Object> body) {
        return authService.createUser(body);
    }

    private String issue(UserDto user) {
        return authService.issueToken(new AppUserPrincipal(
                user.id(), user.username(), "", user.name(), user.title(), user.branch(), user.role()));
    }
}
