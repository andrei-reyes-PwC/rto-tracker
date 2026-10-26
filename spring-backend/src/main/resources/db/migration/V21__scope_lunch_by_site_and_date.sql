ALTER TABLE lunch_recipients
    DROP FOREIGN KEY fk_lunch_recipients_day;

ALTER TABLE lunch_days
    ADD COLUMN site_id BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN site_name VARCHAR(25) NULL,
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (lunch_date, site_id);

ALTER TABLE lunch_recipients
    ADD COLUMN site_id BIGINT NOT NULL DEFAULT 0,
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (lunch_date, site_id, user_email),
    ADD CONSTRAINT fk_lunch_recipients_day
        FOREIGN KEY (lunch_date, site_id)
        REFERENCES lunch_days (lunch_date, site_id)
        ON DELETE CASCADE;
