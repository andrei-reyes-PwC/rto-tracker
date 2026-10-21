CREATE TABLE work_schedules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(10) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE users
    ADD COLUMN work_schedule_id BIGINT NULL,
    ADD CONSTRAINT fk_users_work_schedule FOREIGN KEY (work_schedule_id)
        REFERENCES work_schedules (id) ON DELETE SET NULL;
