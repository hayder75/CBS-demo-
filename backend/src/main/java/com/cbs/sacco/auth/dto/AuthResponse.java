package com.cbs.sacco.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String token,
        Long id,
        String username,
        String name,
        String role,
        String title,
        String branch,
        Instant lastLogin) {

    public static AuthResponse of(UserDto user, String token) {
        return new AuthResponse(token, user.id(), user.username(), user.name(),
                user.role(), user.title(), user.branch(), user.lastLogin());
    }
}