package com.cbs.sacco.common.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public final class FieldCrypto {

    private static final String PREFIX = "enc:v1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final byte[] DEV_KEY =
            "0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8);

    private static volatile SecretKey key;

    private FieldCrypto() {
    }

    public static void init(String base64Key, boolean production) {
        if (base64Key == null || base64Key.isBlank()) {
            if (production) {
                throw new IllegalStateException("FIELD_ENCRYPTION_KEY is required in production");
            }
            key = new SecretKeySpec(DEV_KEY, "AES");
            return;
        }
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("FIELD_ENCRYPTION_KEY must be valid base64", ex);
        }
        if (raw.length != 32) {
            throw new IllegalStateException("FIELD_ENCRYPTION_KEY must decode to 32 bytes");
        }
        key = new SecretKeySpec(raw, "AES");
    }

    public static boolean isEncrypted(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    public static String encrypt(String value) {
        if (value == null || value.isEmpty() || isEncrypted(value)) {
            return value;
        }
        if (key == null) {
            throw new IllegalStateException("Field encryption key is not initialized");
        }
        try {
            byte[] iv = new byte[IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return PREFIX + Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception ex) {
            throw new IllegalStateException("Field encryption failed", ex);
        }
    }

    public static String decrypt(String value) {
        if (value == null || !isEncrypted(value)) {
            return value;
        }
        if (key == null) {
            throw new IllegalStateException("Field encryption key is not initialized");
        }
        try {
            byte[] data = Base64.getDecoder().decode(value.substring(PREFIX.length()));
            if (data.length <= IV_BYTES) {
                throw new IllegalArgumentException("Ciphertext is too short");
            }
            byte[] iv = new byte[IV_BYTES];
            byte[] ciphertext = new byte[data.length - IV_BYTES];
            System.arraycopy(data, 0, iv, 0, IV_BYTES);
            System.arraycopy(data, IV_BYTES, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Field decryption failed", ex);
        }
    }
}
