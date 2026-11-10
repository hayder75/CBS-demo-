package com.cbs.sacco.auth.service;

import com.cbs.sacco.audittrail.service.AuditTrailService;
import com.cbs.sacco.auth.dto.LoginRequest;
import com.cbs.sacco.auth.dto.UserDto;
import com.cbs.sacco.auth.entity.AppUser;
import com.cbs.sacco.auth.entity.Role;
import com.cbs.sacco.auth.repo.RoleRepository;
import com.cbs.sacco.auth.repo.UserRepository;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.auth.security.CustomUserDetailsService;
import com.cbs.sacco.auth.security.JwtService;
import com.cbs.sacco.sms.service.SmsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    private final AuditTrailService auditTrailService;
    private final boolean requireMfa;
    private final int maxFailedAttempts;
    private final int lockMinutes;
    private final TransactionTemplate failureTransaction;

    public AuthService(UserRepository userRepository,
                       CustomUserDetailsService userDetailsService,
                       JwtService jwtService,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       SmsService smsService,
                       @Lazy AuditTrailService auditTrailService,
                       @Value("${app.security.require-mfa:false}") boolean requireMfa,
                       @Value("${app.security.max-failed-attempts:5}") int maxFailedAttempts,
                       @Value("${app.security.lock-minutes:15}") int lockMinutes,
                       PlatformTransactionManager transactionManager) {
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.smsService = smsService;
        this.auditTrailService = auditTrailService;
        this.requireMfa = requireMfa;
        this.maxFailedAttempts = maxFailedAttempts;
        this.lockMinutes = lockMinutes;
        this.failureTransaction = new TransactionTemplate(transactionManager);
        this.failureTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @Transactional
    public UserDto login(LoginRequest request) {
        AppUser user = resolve(request);
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.LOCKED,
                    "Account temporarily locked after repeated failed sign-in attempts");
        }
        if (request.password() == null || request.password().isBlank()
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailure(user);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        user.setFailedAttempts(0);
        user.setLockedUntil(null);

        if (mfaRequired(user)) {
            if (user.getPhone() == null || user.getPhone().isBlank()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Multi-factor authentication is enabled but no phone number is enrolled");
            }
            if (request.otp() == null || request.otp().isBlank()) {
                smsService.sendOtp(user.getPhone(), "Login");
                userRepository.save(user);
                throw new MfaRequiredException(user.getUsername());
            }
            verifyCode(user, request.otp());
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        audit(user.getUsername(), "LOGIN", user, "Successful sign-in");
        return UserDto.from(user);
    }

    @Transactional
    public UserDto verifyMfa(String username, String otp) {
        if (username == null || username.isBlank() || otp == null || otp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and code are required");
        }
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid sign-in attempt"));
        if (!mfaRequired(user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Multi-factor authentication is not required");
        }
        verifyCode(user, otp);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        audit(user.getUsername(), "LOGIN", user, "Successful sign-in with multi-factor authentication");
        return UserDto.from(user);
    }

    private void verifyCode(AppUser user, String otp) {
        try {
            smsService.verifyOtp(user.getPhone(), otp);
        } catch (ResponseStatusException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getReason());
        }
    }

    private boolean mfaRequired(AppUser user) {
        if (!requireMfa || !user.isMfaEnabled()) return false;
        String role = user.getRole() == null ? "" : user.getRole().getCode();
        return "ADMIN".equals(role) || "MANAGER".equals(role);
    }

    private void registerFailure(AppUser user) {
        failureTransaction.execute(status -> {
            AppUser fresh = userRepository.findById(user.getId()).orElse(user);
            int attempts = fresh.getFailedAttempts() + 1;
            fresh.setFailedAttempts(attempts);
            if (attempts >= maxFailedAttempts) {
                fresh.setLockedUntil(Instant.now().plus(lockMinutes, ChronoUnit.MINUTES));
                fresh.setFailedAttempts(0);
            }
            userRepository.save(fresh);
            audit(fresh.getUsername(), "LOGIN", fresh,
                    attempts >= maxFailedAttempts ? "Account locked after repeated failures" : "Failed sign-in attempt");
            return null;
        });
    }

    private void audit(String actor, String action, AppUser user, String detail) {
        try {
            auditTrailService.append(actor, action, "AppUser", String.valueOf(user.getId()),
                    null, null, null, detail, null);
        } catch (RuntimeException ignored) {
        }
    }

    private AppUser resolve(LoginRequest request) {
        if (request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        return userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
    }

    public String issueToken(AppUserPrincipal principal) {
        return jwtService.generateToken(principal);
    }

    public List<UserDto> listUsers() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto createUser(Map<String, Object> body) {
        String username = str(body, "username");
        String fullName = str(body, "name");
        String roleCode = str(body, "role");
        String password = orDefault(str(body, "password"), "Demo1234");
        if (username == null || fullName == null || roleCode == null) {
            throw new IllegalArgumentException("username, name and role are required");
        }
        if (password.length() < 8 || !password.matches(".*[A-Za-z].*") || !password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("password must be at least 8 characters and include a letter and a number");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("username already exists: " + username);
        }
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalArgumentException("unknown role: " + roleCode));
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setTitle(str(body, "title"));
        user.setBranch(str(body, "branch"));
        user.setPhone(str(body, "phone"));
        user.setRole(role);
        return UserDto.from(userRepository.save(user));
    }

    public UserDto current(AppUserPrincipal principal) {
        AppUser user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return UserDto.from(user);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static String orDefault(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }
}
