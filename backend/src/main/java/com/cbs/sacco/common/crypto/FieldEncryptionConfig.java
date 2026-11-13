package com.cbs.sacco.common.crypto;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FieldEncryptionConfig {

    private final String fieldKey;

    public FieldEncryptionConfig(@Value("${app.security.field-key:}") String fieldKey) {
        this.fieldKey = fieldKey;
    }

    @PostConstruct
    public void init() {
        FieldCrypto.init(fieldKey);
    }
}
