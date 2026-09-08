package com.cbs.sacco.auth.dto;

import com.cbs.sacco.auth.entity.AppUser;

import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String name,
        String role,
        String title,
        String branch,
        Instant lastLogin) {

    public static UserDto from(AppUser user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().getCode(),
                user.getTitle(),
                user.getBranch(),
                user.getLastLoginAt());
    }
}