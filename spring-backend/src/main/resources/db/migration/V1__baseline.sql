-- Clean-install baseline representing the current production schema.
CREATE TABLE users (
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(60) NULL,
    platform_id BIGINT NULL,
    work_schedule_id BIGINT NULL,
    site_id BIGINT NULL,
    PRIMARY KEY (email),
    INDEX idx_users_platform_id (platform_id)
);

CREATE TABLE roles (
    code VARCHAR(50) NOT NULL,
    protected_role BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (code)
);

INSERT INTO roles (code, protected_role) VALUES
    ('USER', FALSE),
    ('ADMIN', FALSE),
    ('SUPER_ADMIN', TRUE),
    ('LUNCH', FALSE);

CREATE TABLE user_roles (
    user_email VARCHAR(254) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_email, role_code),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_code)
        REFERENCES roles (code) ON DELETE RESTRICT
);

CREATE TABLE platforms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_platforms_name UNIQUE (name)
);

CREATE TABLE work_schedules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(10) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_work_schedules_name UNIQUE (name)
);

CREATE TABLE sites (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(25) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_sites_name UNIQUE (name)
);

ALTER TABLE users
    ADD CONSTRAINT fk_users_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_work_schedule FOREIGN KEY (work_schedule_id)
        REFERENCES work_schedules (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_site FOREIGN KEY (site_id)
        REFERENCES sites (id) ON DELETE SET NULL;

CREATE TABLE office_days (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_email VARCHAR(254) NOT NULL,
    office_date DATE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_office_days_user_date UNIQUE (user_email, office_date),
    CONSTRAINT fk_office_days_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE
);

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

CREATE TABLE lunch_days (
    lunch_date DATE NOT NULL,
    site_id BIGINT NOT NULL DEFAULT 0,
    site_name VARCHAR(25) NULL,
    locked_by VARCHAR(254) NOT NULL,
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lunch_date, site_id)
);

CREATE TABLE lunch_recipients (
    lunch_date DATE NOT NULL,
    site_id BIGINT NOT NULL DEFAULT 0,
    user_email VARCHAR(254) NOT NULL,
    received BOOLEAN NOT NULL DEFAULT FALSE,
    handed_out_by VARCHAR(254) NULL,
    PRIMARY KEY (lunch_date, site_id, user_email),
    CONSTRAINT fk_lunch_recipients_day FOREIGN KEY (lunch_date, site_id)
        REFERENCES lunch_days (lunch_date, site_id) ON DELETE CASCADE,
    CONSTRAINT fk_lunch_recipients_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE
);
