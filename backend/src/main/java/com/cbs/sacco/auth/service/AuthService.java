package com.cbs.sacco.auth.service;

import com.cbs.sacco.auth.dto.LoginRequest;
import com.cbs.sacco.auth.dto.UserDto;
import com.cbs.sacco.auth.entity.AppUser;
import com.cbs.sacco.auth.repo.UserRepository;
import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.auth.security.CustomUserDetailsService;
import com.cbs.sacco.auth.security.JwtService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       CustomUserDetailsService userDetailsService,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
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

    public UserDto current(AppUserPrincipal principal) {
        AppUser user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return UserDto.from(user);
    }
}