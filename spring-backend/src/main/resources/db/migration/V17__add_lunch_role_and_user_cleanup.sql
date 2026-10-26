ALTER TABLE lunch_days DROP FOREIGN KEY fk_lunch_days_locked_by;

ALTER TABLE lunch_recipients DROP FOREIGN KEY fk_lunch_recipients_user;
ALTER TABLE lunch_recipients
    ADD CONSTRAINT fk_lunch_recipients_user
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE;

INSERT INTO roles (code, protected_role) VALUES ('LUNCH', FALSE);
