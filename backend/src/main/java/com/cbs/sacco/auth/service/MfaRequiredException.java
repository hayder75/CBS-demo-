package com.cbs.sacco.auth.service;

public class MfaRequiredException extends RuntimeException {
    private final String username;

    public MfaRequiredException(String username) {
        super("Multi-factor authentication required");
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}
