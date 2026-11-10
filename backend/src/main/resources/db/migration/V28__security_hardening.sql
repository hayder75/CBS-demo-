ALTER TABLE app_user ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

UPDATE app_user
SET phone = '+251932123090'
WHERE username IN ('admin', 'manager')
  AND (phone IS NULL OR phone = '');

CREATE OR REPLACE FUNCTION forbid_append_only_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'This table is append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_trail_append_only ON audit_trail;
CREATE TRIGGER audit_trail_append_only
    BEFORE UPDATE OR DELETE ON audit_trail
    FOR EACH ROW EXECUTE FUNCTION forbid_append_only_mutation();

DROP TRIGGER IF EXISTS sms_log_append_only ON sms_log;
CREATE TRIGGER sms_log_append_only
    BEFORE UPDATE OR DELETE ON sms_log
    FOR EACH ROW EXECUTE FUNCTION forbid_append_only_mutation();
