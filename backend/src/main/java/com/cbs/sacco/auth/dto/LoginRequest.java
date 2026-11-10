package com.cbs.sacco.auth.dto;

public record LoginRequest(String username, String password, String role, String otp) {}
