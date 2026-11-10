create table sms_otp_challenge (
    id bigserial primary key,
    phone varchar(32) not null,
    purpose varchar(40),
    vc varchar(160),
    status varchar(20) not null default 'Pending',
    attempts int not null default 0,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    verified_at timestamptz
);

create index idx_sms_otp_phone_status on sms_otp_challenge (phone, status);

create table sms_log (
    id bigserial primary key,
    phone varchar(32) not null,
    purpose varchar(40),
    status varchar(20) not null,
    detail varchar(240),
    created_at timestamptz not null default now()
);

create index idx_sms_log_created on sms_log (created_at desc);
