package com.cbs.sacco.auth.service;

import com.cbs.sacco.auth.dto.LoginRequest;
import com.cbs.sacco.auth.dto.UserDto;
import com.cbs.sacco.auth.entity.AppUser;
import com.cbs.sacco.auth.entity.Role;
import com.cbs.sacco.auth.repo.RoleRepository;
import com.cbs.sacco.auth.repo.UserRepository;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.auth.security.CustomUserDetailsService;
import com.cbs.sacco.auth.security.JwtService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       CustomUserDetailsService userDetailsService,
                       JwtService jwtService,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto login(LoginRequest request) {
        AppUser user = resolve(request);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        return UserDto.from(user);
    }

    private AppUser resolve(LoginRequest request) {
        if (request.username() != null && !request.username().isBlank()) {
            return userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + request.username()));
        }
        if (request.role() != null && !request.role().isBlank()) {
            return userRepository.findFirstByRoleCode(request.role())
                    .orElseThrow(() -> new UsernameNotFoundException("No user for role: " + request.role()));
        }
        return userRepository.findFirstByRoleCode("MANAGER").orElseThrow();
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
        if (username == null || fullName == null || roleCode == null) {
            throw new IllegalArgumentException("username, name and role are required");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("username already exists: " + username);
        }
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalArgumentException("unknown role: " + roleCode));
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode(orDefault(str(body, "password"), "demo123")));
        user.setTitle(str(body, "title"));
        user.setBranch(str(body, "branch"));
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