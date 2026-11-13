package com.cbs.sacco.common.crypto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(100)
public class FieldEncryptionBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(FieldEncryptionBackfill.class);

    private static final String[][] COLUMNS = {
            {"member", "phone"},
            {"member", "email"},
            {"member", "fayda_id"},
            {"next_of_kin", "phone"},
            {"beneficiary", "phone"},
            {"app_user", "phone"},
            {"sms_log", "phone"},
            {"sms_otp_challenge", "phone"},
            {"referral_record", "referee_phone"},
            {"membership_application", "phone"},
            {"membership_application", "fayda_id"},
            {"membership_application", "email"}
    };

    private final JdbcTemplate jdbc;
    private final boolean enabled;

    public FieldEncryptionBackfill(
            JdbcTemplate jdbc,
            @Value("${app.security.encrypt-backfill:false}") boolean enabled) {
        this.jdbc = jdbc;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) return;
        int total = 0;
        for (String[] column : COLUMNS) {
            total += encryptColumn(column[0], column[1]);
        }
        log.info("Field encryption backfill completed; {} value(s) encrypted", total);
    }

    private int encryptColumn(String table, String column) {
        int[] count = {0};
        boolean smsLog = "sms_log".equals(table);
        try {
            if (smsLog) {
                jdbc.execute("ALTER TABLE sms_log DISABLE TRIGGER sms_log_append_only");
            }
            jdbc.query("SELECT id, " + column + " FROM " + table
                            + " WHERE " + column + " IS NOT NULL AND " + column + " <> ''",
                    rs -> {
                        long id = rs.getLong("id");
                        String value = rs.getString(column);
                        if (value != null && !FieldCrypto.isEncrypted(value)) {
                            jdbc.update("UPDATE " + table + " SET " + column + " = ? WHERE id = ?",
                                    FieldCrypto.encrypt(value), id);
                            count[0]++;
                        }
                    });
        } catch (RuntimeException ex) {
            log.warn("Field encryption backfill skipped {}.{}: {}", table, column, ex.getMessage());
        } finally {
            if (smsLog) {
                try {
                    jdbc.execute("ALTER TABLE sms_log ENABLE TRIGGER sms_log_append_only");
                } catch (RuntimeException ex) {
                    log.warn("Could not re-enable sms_log append-only trigger: {}", ex.getMessage());
                }
            }
        }
        return count[0];
    }
}
