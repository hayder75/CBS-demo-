package com.cbs.sacco.auth.web;

import com.cbs.sacco.auth.dto.AuthResponse;
import com.cbs.sacco.auth.dto.LoginRequest;
import com.cbs.sacco.auth.dto.UserDto;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.auth.service.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        UserDto user = authService.login(request);
        String token = authService.issueToken(new AppUserPrincipal(
                user.id(), user.username(), "", user.name(), user.title(), user.branch(), user.role()));
        return AuthResponse.of(user, token);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return principal == null ? null : authService.current(principal);
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return authService.listUsers();
    }
}