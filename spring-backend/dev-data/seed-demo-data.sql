-- Optional local development data for Manage, RTO dashboard, and event testing.
-- Never run this against production.
-- Demo login password for all accounts: RtoDemo123!
-- Creates 200 synthetic users across three platforms, schedules, and Sites,
-- weekday attendance through November 30, 2026, and global/platform events.

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

INSERT INTO sites (name) VALUES
    ('Demo Central'),
    ('Demo North'),
    ('Demo South')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (email, password_hash, platform_id, work_schedule_id, site_id)
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
        WHEN 0 THEN 'Hybrid' WHEN 1 THEN 'Office' ELSE 'Flex' END),
    (SELECT id FROM sites WHERE name = CASE MOD(user_number - 1, 3)
        WHEN 0 THEN 'Demo Central' WHEN 1 THEN 'Demo North' ELSE 'Demo South' END)
FROM demo_users
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    platform_id = VALUES(platform_id),
    work_schedule_id = VALUES(work_schedule_id),
    site_id = VALUES(site_id);

INSERT INTO users (email, password_hash, platform_id, work_schedule_id, site_id)
SELECT
    'rto.superadmin@example.test',
    '$2a$10$ZDZJ5WWXe1/Vf7wEWKfQ5OkfDSYn9l1/b9gHMDM1uzvgdGld7PyUK',
    (SELECT id FROM platforms WHERE name = 'Demo Tech'),
    (SELECT id FROM work_schedules WHERE name = 'Hybrid'),
    (SELECT id FROM sites WHERE name = 'Demo Central')
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    platform_id = VALUES(platform_id),
    work_schedule_id = VALUES(work_schedule_id),
    site_id = VALUES(site_id);

INSERT INTO user_roles (user_email, role_code)
SELECT email, 'USER' FROM users WHERE email LIKE 'rto.demo%@example.test'
ON DUPLICATE KEY UPDATE role_code = VALUES(role_code);

INSERT INTO user_roles (user_email, role_code)
VALUES ('rto.superadmin@example.test', 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE role_code = VALUES(role_code);

-- Rebuild demo attendance so rerunning the seed stays idempotent.
DELETE FROM office_days WHERE user_email LIKE 'rto.demo%@example.test';

SET @attendance_start = DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY);

INSERT INTO office_days (user_email, office_date)
WITH RECURSIVE demo_users (user_number) AS (
    SELECT 1
    UNION ALL
    SELECT user_number + 1 FROM demo_users WHERE user_number < 200
),
calendar_days (office_date) AS (
    SELECT @attendance_start
    UNION ALL
    SELECT DATE_ADD(office_date, INTERVAL 1 DAY)
    FROM calendar_days
    WHERE office_date < '2026-11-30'
)
SELECT
    CONCAT('rto.demo', IF(demo_users.user_number < 100,
        LPAD(demo_users.user_number, 2, '0'), demo_users.user_number), '@example.test'),
    calendar_days.office_date
FROM demo_users
CROSS JOIN calendar_days
WHERE WEEKDAY(calendar_days.office_date) < 5
    AND MOD(demo_users.user_number * 7 + DAYOFYEAR(calendar_days.office_date) * 11, 10)
        < CASE MOD(demo_users.user_number - 1, 3)
            WHEN 0 THEN 5 WHEN 1 THEN 8 ELSE 3 END;

-- Rebuild only the demo events. One global all-hands and three platform events
-- are seeded for each week through November 30, 2026.
DELETE FROM events WHERE title LIKE 'Demo %';

INSERT INTO events (event_date, title, kind, event_time, place, required_in_office, scope, platform_id)
WITH RECURSIVE calendar_days (event_date) AS (
    SELECT CURRENT_DATE()
    UNION ALL
    SELECT DATE_ADD(event_date, INTERVAL 1 DAY)
    FROM calendar_days
    WHERE event_date < '2026-11-30'
)
SELECT event_date, 'Demo All Hands', 'Town Hall', '10:00 AM', 'Demo Central', TRUE, 'GLOBAL', NULL
FROM calendar_days
WHERE WEEKDAY(event_date) = 3
UNION ALL
SELECT calendar_days.event_date,
    CONCAT('Demo ', platforms.name, ' Meetup'),
    'Team Meeting', '02:00 PM', 'Demo Office', FALSE, 'PLATFORM', platforms.id
FROM calendar_days
CROSS JOIN platforms
WHERE platforms.name IN ('Demo Tech', 'Demo Finance', 'Demo Ops')
    AND WEEKDAY(calendar_days.event_date) = 0;

COMMIT;
