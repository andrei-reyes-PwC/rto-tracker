ALTER TABLE global_settings
    ADD COLUMN scheduling_mode VARCHAR(25) NOT NULL DEFAULT 'FLEXIBLE',
    ADD CONSTRAINT chk_global_scheduling_mode CHECK (scheduling_mode IN ('FLEXIBLE', 'PEZA'));

ALTER TABLE platforms
    ADD COLUMN scheduling_mode VARCHAR(25) NULL,
    ADD CONSTRAINT chk_platform_scheduling_mode CHECK (scheduling_mode IS NULL OR scheduling_mode IN ('FLEXIBLE', 'PEZA'));

-- Existing weekend overrides keep their previous flexible scheduling behavior.
UPDATE platforms SET scheduling_mode = 'FLEXIBLE' WHERE saturday_day_off IS NOT NULL;

ALTER TABLE platforms
    ADD CONSTRAINT chk_platform_mode_inheritance CHECK (
        (saturday_day_off IS NULL AND scheduling_mode IS NULL)
        OR (saturday_day_off IS NOT NULL AND scheduling_mode IS NOT NULL)
    );
