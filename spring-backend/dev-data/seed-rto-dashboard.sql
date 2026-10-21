-- Optional local development data. Never run this against production.
-- Demo login password for all accounts: RtoDemo123!
-- Idempotent for this demo namespace; generates office days for the current Monday-Friday.

START TRANSACTION;

INSERT INTO platforms (name) VALUES
    ('Demo Tech'),
    ('Demo Finance'),
    ('Demo Ops')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO work_schedules (name)
SELECT 'Hybrid' WHERE NOT EXISTS (SELECT 1 FROM work_schedules WHERE name = 'Hybrid');
INSERT INTO work_schedules (name)
SELECT 'Office' WHERE NOT EXISTS (SELECT 1 FROM work_schedules WHERE name = 'Office');
INSERT INTO work_schedules (name)
SELECT 'Flex' WHERE NOT EXISTS (SELECT 1 FROM work_schedules WHERE name = 'Flex');

INSERT INTO users (email, password_hash, platform_id, work_schedule_id) VALUES
    ('rto.demo01@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Tech'), (SELECT id FROM work_schedules WHERE name = 'Hybrid' ORDER BY id LIMIT 1)),
    ('rto.demo02@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Tech'), (SELECT id FROM work_schedules WHERE name = 'Office' ORDER BY id LIMIT 1)),
    ('rto.demo03@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Tech'), (SELECT id FROM work_schedules WHERE name = 'Flex' ORDER BY id LIMIT 1)),
    ('rto.demo04@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Tech'), (SELECT id FROM work_schedules WHERE name = 'Hybrid' ORDER BY id LIMIT 1)),
    ('rto.demo05@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Finance'), (SELECT id FROM work_schedules WHERE name = 'Office' ORDER BY id LIMIT 1)),
    ('rto.demo06@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Finance'), (SELECT id FROM work_schedules WHERE name = 'Flex' ORDER BY id LIMIT 1)),
    ('rto.demo07@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Finance'), (SELECT id FROM work_schedules WHERE name = 'Hybrid' ORDER BY id LIMIT 1)),
    ('rto.demo08@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Finance'), (SELECT id FROM work_schedules WHERE name = 'Office' ORDER BY id LIMIT 1)),
    ('rto.demo09@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Ops'), (SELECT id FROM work_schedules WHERE name = 'Flex' ORDER BY id LIMIT 1)),
    ('rto.demo10@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Ops'), (SELECT id FROM work_schedules WHERE name = 'Hybrid' ORDER BY id LIMIT 1)),
    ('rto.demo11@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Ops'), (SELECT id FROM work_schedules WHERE name = 'Office' ORDER BY id LIMIT 1)),
    ('rto.demo12@example.test', '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK', (SELECT id FROM platforms WHERE name = 'Demo Ops'), (SELECT id FROM work_schedules WHERE name = 'Flex' ORDER BY id LIMIT 1))
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    platform_id = VALUES(platform_id),
    work_schedule_id = VALUES(work_schedule_id);

INSERT INTO user_roles (user_email, role_code)
SELECT email, 'USER' FROM users WHERE email LIKE 'rto.demo%@example.test'
ON DUPLICATE KEY UPDATE role_code = VALUES(role_code);

SET @week_start = DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY);
INSERT INTO office_days (user_email, office_date) VALUES
    ('rto.demo01@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo02@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo05@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo08@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo09@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo11@example.test', DATE_ADD(@week_start, INTERVAL 0 DAY)),
    ('rto.demo01@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo03@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo04@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo06@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo09@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo12@example.test', DATE_ADD(@week_start, INTERVAL 1 DAY)),
    ('rto.demo02@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo03@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo05@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo07@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo10@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo11@example.test', DATE_ADD(@week_start, INTERVAL 2 DAY)),
    ('rto.demo01@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo04@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo05@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo06@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo08@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo12@example.test', DATE_ADD(@week_start, INTERVAL 3 DAY)),
    ('rto.demo02@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo03@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo07@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo09@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo10@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo11@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY)),
    ('rto.demo12@example.test', DATE_ADD(@week_start, INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE office_date = VALUES(office_date);

COMMIT;
