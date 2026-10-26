ALTER TABLE work_schedules
    ADD CONSTRAINT uk_work_schedules_name UNIQUE (name);
