-- Optional local development data for RTO dashboard and planner testing.
-- Never run this against production.
-- Demo login password for all accounts: RtoDemo123!
-- Creates 200 synthetic users across three platforms and work schedules,
-- with varied office attendance for the current Monday-Friday.

START TRANSACTION;

INSERT INTO platforms (name) VALUES
    ('Demo Tech'),
    ('Demo Finance'),
    ('Demo Ops')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO work_schedules (name) VALUES
    ('Hybrid'),
    ('Office'),
    ('Flex')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (email, password_hash, platform_id, work_schedule_id)
WITH RECURSIVE demo_users (user_number) AS (
    SELECT 1
    UNION ALL
    SELECT user_number + 1 FROM demo_users WHERE user_number < 200
)
SELECT
    CONCAT('rto.demo', IF(user_number < 100, LPAD(user_number, 2, '0'), user_number), '@example.test'),
    '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK',
    (SELECT id FROM platforms WHERE name = CASE MOD(user_number - 1, 3)
        WHEN 0 THEN 'Demo Tech' WHEN 1 THEN 'Demo Finance' ELSE 'Demo Ops' END),
    (SELECT id FROM work_schedules WHERE name = CASE MOD(user_number - 1, 3)
        WHEN 0 THEN 'Hybrid' WHEN 1 THEN 'Office' ELSE 'Flex' END)
FROM demo_users
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    platform_id = VALUES(platform_id),
    work_schedule_id = VALUES(work_schedule_id);

INSERT INTO user_roles (user_email, role_code)
SELECT email, 'USER' FROM users WHERE email LIKE 'rto.demo%@example.test'
ON DUPLICATE KEY UPDATE role_code = VALUES(role_code);

-- Rebuild only the demo accounts' office days so rerunning the seed is idempotent
-- and does not leave attendance behind from an earlier week.
DELETE FROM office_days WHERE user_email LIKE 'rto.demo%@example.test';

SET @week_start = DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY);

INSERT INTO office_days (user_email, office_date)
WITH RECURSIVE demo_users (user_number) AS (
    SELECT 1
    UNION ALL
    SELECT user_number + 1 FROM demo_users WHERE user_number < 200
),
weekdays (day_offset, attendance_threshold) AS (
    SELECT 0, 4 UNION ALL
    SELECT 1, 5 UNION ALL
    SELECT 2, 6 UNION ALL
    SELECT 3, 5 UNION ALL
    SELECT 4, 3
)
SELECT
    CONCAT('rto.demo', IF(demo_users.user_number < 100,
        LPAD(demo_users.user_number, 2, '0'), demo_users.user_number), '@example.test'),
    DATE_ADD(@week_start, INTERVAL weekdays.day_offset DAY)
FROM demo_users
CROSS JOIN weekdays
WHERE MOD(demo_users.user_number * 7 + weekdays.day_offset * 11, 10)
    < weekdays.attendance_threshold;

COMMIT;
