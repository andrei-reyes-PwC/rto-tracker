CREATE TABLE global_settings (
    id BIGINT NOT NULL PRIMARY KEY,
    saturday_day_off BOOLEAN NOT NULL DEFAULT FALSE,
    sunday_day_off BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_global_settings_singleton CHECK (id = 1)
);

INSERT INTO global_settings (id, saturday_day_off, sunday_day_off) VALUES (1, FALSE, FALSE);

ALTER TABLE platforms
    ADD COLUMN saturday_day_off BOOLEAN NULL,
    ADD COLUMN sunday_day_off BOOLEAN NULL,
    ADD CONSTRAINT chk_platform_weekend_override CHECK (
        (saturday_day_off IS NULL AND sunday_day_off IS NULL)
        OR (saturday_day_off IS NOT NULL AND sunday_day_off IS NOT NULL)
    );
