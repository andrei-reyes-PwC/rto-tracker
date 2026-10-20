CREATE TABLE platforms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_platforms_name UNIQUE (name)
);

CREATE TABLE platform_users (
    platform_id BIGINT NOT NULL,
    user_email VARCHAR(254) NOT NULL,
    PRIMARY KEY (platform_id, user_email),
    CONSTRAINT fk_platform_users_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (id) ON DELETE CASCADE,
    CONSTRAINT fk_platform_users_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE
);
