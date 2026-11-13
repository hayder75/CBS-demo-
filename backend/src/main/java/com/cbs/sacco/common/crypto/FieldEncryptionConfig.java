package com.cbs.sacco.common.crypto;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FieldEncryptionConfig {

    private static final Logger log = LoggerFactory.getLogger(FieldEncryptionConfig.class);

    private final String fieldKey;
    private final boolean production;

    public FieldEncryptionConfig(
            @Value("${app.security.field-key:}") String fieldKey,
            @Value("${app.security.production:false}") boolean production) {
        this.fieldKey = fieldKey;
        this.production = production;
    }

    @PostConstruct
    public void init() {
        FieldCrypto.init(fieldKey, production);
        if (!production && (fieldKey == null || fieldKey.isBlank())) {
            log.warn("FIELD_ENCRYPTION_KEY is not set; using the development key outside production");
        }
    }
}
