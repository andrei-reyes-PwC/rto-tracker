CREATE TABLE lunch_days (
    lunch_date DATE NOT NULL,
    locked_by VARCHAR(254) NOT NULL,
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lunch_date),
    CONSTRAINT fk_lunch_days_locked_by FOREIGN KEY (locked_by) REFERENCES users(email)
);

CREATE TABLE lunch_recipients (
    lunch_date DATE NOT NULL,
    user_email VARCHAR(254) NOT NULL,
    received BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (lunch_date, user_email),
    CONSTRAINT fk_lunch_recipients_day FOREIGN KEY (lunch_date) REFERENCES lunch_days(lunch_date) ON DELETE CASCADE,
    CONSTRAINT fk_lunch_recipients_user FOREIGN KEY (user_email) REFERENCES users(email)
);
