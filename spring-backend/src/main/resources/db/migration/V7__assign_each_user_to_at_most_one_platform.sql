ALTER TABLE users
    ADD COLUMN platform_id BIGINT NULL,
    ADD INDEX idx_users_platform_id (platform_id),
    ADD CONSTRAINT fk_users_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (id) ON DELETE SET NULL;

UPDATE users user_record
JOIN (
    SELECT user_email, MIN(platform_id) AS platform_id
    FROM platform_users
    GROUP BY user_email
) membership ON membership.user_email = user_record.email
SET user_record.platform_id = membership.platform_id;

DROP TABLE platform_users;
