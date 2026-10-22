CREATE TABLE events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_date DATE NOT NULL,
    title VARCHAR(120) NOT NULL,
    kind VARCHAR(40) NOT NULL,
    event_time VARCHAR(30) NOT NULL,
    place VARCHAR(120) NOT NULL,
    required_in_office BOOLEAN NOT NULL DEFAULT FALSE,
    scope VARCHAR(20) NOT NULL,
    platform_id BIGINT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_events_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (id) ON DELETE CASCADE,
    CONSTRAINT chk_events_scope CHECK ((scope = 'GLOBAL' AND platform_id IS NULL)
        OR (scope = 'PLATFORM' AND platform_id IS NOT NULL)),
    INDEX idx_events_date_scope (event_date, scope, platform_id)
);
