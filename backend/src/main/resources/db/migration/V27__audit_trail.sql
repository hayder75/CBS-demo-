CREATE TABLE audit_trail (
    id          BIGSERIAL PRIMARY KEY,
    actor       VARCHAR(120) NOT NULL,
    action      VARCHAR(20)  NOT NULL,
    entity      VARCHAR(120) NOT NULL,
    entity_id   VARCHAR(120),
    field_name  VARCHAR(120),
    old_value   TEXT,
    new_value   TEXT,
    detail      TEXT,
    ip          VARCHAR(64),
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    hash        VARCHAR(64)  NOT NULL,
    prev_hash   VARCHAR(64)
);

CREATE INDEX idx_audit_trail_occurred_at ON audit_trail(occurred_at DESC);
CREATE INDEX idx_audit_trail_entity ON audit_trail(entity, entity_id);
CREATE INDEX idx_audit_trail_actor ON audit_trail(actor);
CREATE INDEX idx_audit_trail_action ON audit_trail(action);
