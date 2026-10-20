CREATE TABLE office_days (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_email VARCHAR(254) NOT NULL,
    office_date DATE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_office_days_user_date UNIQUE (user_email, office_date),
    INDEX idx_office_days_date_user (office_date, user_email),
    CONSTRAINT fk_office_days_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE
);
