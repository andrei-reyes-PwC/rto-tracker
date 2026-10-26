# Project Notes

This file is the short working map for `spring-backend`. Read it before backend work and update it when structure, dependencies, endpoints, configuration, or conventions change.

## What this project is

- A standalone Spring Boot REST API built with Maven. A bounded in-memory store backs API request limits; it is intended for a single backend instance and resets when the process restarts.
- Spring Boot `4.1.1`, Java `25`, Spring MVC, Spring Data JPA, MySQL, Flyway, and springdoc OpenAPI are configured in `pom.xml`.
- Spring Boot DevTools is an optional development dependency; with `mvn spring-boot:run`, the app restarts when compiled classpath files change. The root `.vscode/settings.json` enables Java auto-build on save.
- Flyway creates the `users` table with email as its primary key, a nullable BCrypt password hash for compatibility with existing records, optional platform and work schedule foreign keys, a role catalog, and a `user_roles` many-to-many association; Hibernate validates the mapped entities.
- Platform names are limited to 20 characters by API validation and the database column; Flyway migration `V8` narrows the existing `platforms.name` column.
- Persisted string limits should be explicit and appropriate to the field, enforced by request validation and database columns, and reflected in editable UI fields. New strings default to 25 characters unless the feature specifies otherwise; standard exceptions include email addresses and password hashes. Role codes are capped at 50 characters in role-update requests to match their column, and event scope requests are capped at 20 to match their column.
- Work schedules are managed by the SUPER_ADMIN-protected `/api/work-schedules` CRUD endpoints; the list accepts optional server-side name `search`. Work schedule names are limited to 10 characters; each user may reference zero or one work schedule through nullable `users.work_schedule_id`, and schedule deletion clears that reference.
- Events are managed through `/api/events` CRUD endpoints: SUPER_ADMIN users manage all global and platform events; ADMIN users assigned to a platform can manage only that platform's events. Event titles are limited to 50 characters by API validation. The `/api/events/manage` list accepts optional server-side `search` across title, kind, place, time, scope, and platform name, plus an optional exact `date` filter, and scopes results to the caller's platform for ADMIN users. Events are global or tied to one platform; deleting a platform cascades to its events. Authenticated monthly event reads return global events and events for the caller's platform.
- `GET /api/dashboard/rto?weekStart=YYYY-MM-DD` returns an ADMIN- and SUPER_ADMIN-only Monday–Friday report with daily attendance, total RTO-day selections, unique attendees, platform/work schedule group totals, and daily counts within each group.
- `POST /api/auth/assistant-token` issues a 5-minute RS256 JWT for `assistant:chat`. The AI uses it with read-only `GET /api/assistant/tools/events`, `/rto-member-counts`, and `/my-schedule` endpoints; each endpoint derives the caller from the JWT and allows dates from the first of the current month through the end of next month. Past records are historical only; planning suggestions remain future-only. Logs include date windows and item counts only. The browser sends the token to AI; the Spring session cookie is not shared. Configure `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_PRIVATE_KEY_PATH`, and `JWT_PUBLIC_KEY_PATH`; local RSA keys live in ignored `.secrets/`.
- The API exposes `POST /api/auth/login`, user CRUD under `/api/users`, platform CRUD under `/api/platforms` (the admin list returns member counts and accepts optional server-side `search`; `GET /api/platforms/{id}` returns member emails; `GET /api/platforms/options` returns filter options), the role catalog under `/api/roles`, and authenticated office-day queries and monthly replacement under `/api/office-days`. The monthly GET returns personal office days and platform attendance counts together. Login and `GET /api/auth/me` return an optional singular `platform` object (`id`, `name`).
- `GET /api/users` returns the general paginated roster with each user's optional singular `platform`; it is SUPER_ADMIN-only and `includePlatforms=false` omits the page-level platform catalog. `GET /api/users/manage` returns the paginated Manage Users roster with server-side email search and combined optional `roleCode`, `platformId`, and `workScheduleId` filters, including `withoutPlatform` and `withoutWorkSchedule` for unassigned users. SUPER_ADMIN users may query all platforms; ADMIN users must have a platform and are always scoped to it regardless of query parameters. `GET /api/users/manage/filters` returns role, platform, and work-schedule filter options; ADMIN users receive only their platform and schedules assigned to its members. Both roster endpoints support `page` (zero-based, default `0`) and `size` (default `20`, max `100`). User detail and mutations remain SUPER_ADMIN-only. `GET /api/platforms/options` remains available for other platform-option consumers.
- Swagger UI and OpenAPI docs are available at `/swagger-ui.html` and `/v3/api-docs` outside production. The `prod` profile disables both and omits the Swagger origin from CORS and state-changing request origin checks.
- The default HTTP port is `8080`.

## Key files

- `src/main/java/com/rtotracker/backend/user/` contains the user entity, repository, service, and CRUD controller.
- `src/main/java/com/rtotracker/backend/platform/` contains the platform entity, repository, service, and SUPER_ADMIN-protected CRUD controller. Platforms have unique names and can group multiple users; each user may belong to zero or one platform.
- `src/main/java/com/rtotracker/backend/workschedule/` contains the work schedule entity, repository, service, and SUPER_ADMIN-protected CRUD controller. A work schedule can be assigned to multiple users; a user has at most one.
- `src/main/java/com/rtotracker/backend/event/` contains event persistence and APIs. Monthly reads derive platform scope from the session; administrators manage all events.
- `src/main/java/com/rtotracker/backend/dashboard/` aggregates saved office-day records into a weekly report using users' current platform and work schedule assignments.
- `src/main/java/com/rtotracker/backend/role/` contains the role entity, repository, read service, and read-only `GET /api/roles` catalog endpoint.
- User creation assigns `USER` by default; user and authentication responses include role codes. `SUPER_ADMIN` is seeded as a protected catalog role. `PUT /api/users/{email}` updates a user's email and assignable roles while preserving the password and linked office-day records; protected users cannot be edited, protected roles cannot be assigned, and duplicate emails are rejected. General `/api/users` reads and all mutations require SUPER_ADMIN; only the `/manage` roster and its filter choices also allow platform-assigned ADMIN users, scoped to their platform. Protected users cannot be deleted, and administrators cannot delete themselves.
- `src/main/java/com/rtotracker/backend/office/` contains office-day persistence and authenticated schedule APIs. `GET /api/office-days?month=YYYY-MM` returns the caller's schedule and daily counts of other platform members; `GET /api/office-days/platform/attendance?month=YYYY-MM` remains available as a standalone attendance query, and `GET /api/office-days/platform?date=YYYY-MM-DD` returns colleagues on a selected date. Platform membership is derived from the session user, and platform views exclude the caller.
- `src/main/java/com/rtotracker/backend/auth/` contains login, current-session (`GET /api/auth/me`), logout (`POST /api/auth/logout`), credential verification, and shared SUPER_ADMIN authorization; logout invalidates the HTTP session.
- `src/main/java/com/rtotracker/backend/ratelimit/` applies bounded in-memory fixed-window limits to all `/api/**` MVC endpoints. Signed-in requests use an account bucket; unauthenticated requests use the resolved client IP. Login has an additional, tighter IP bucket. Exceeded limits return JSON `429` responses with `Retry-After`; exhausted in-memory capacity returns `503`. This store is single-instance only and resets on restart.
- `CsrfOriginInterceptor` checks `Origin` (or `Referer` when Origin is absent) on state-changing API requests against the configured frontend and, outside production, Swagger origin. The Swagger origin defaults to `http://localhost:8080` in development. Production disables Swagger/OpenAPI and does not allow a Swagger origin; requests without either header remain supported for non-browser clients. CORS permits the configured origins.
- `src/main/java/com/rtotracker/backend/WebCorsConfig.java` configures credentialed CORS globally for `/api/**`.
- `src/main/java/com/rtotracker/backend/ApiExceptionHandler.java` formats validation, malformed request, and application status errors as JSON responses with explanations.
- `src/main/resources/db/migration/` contains Flyway schema migrations.
- `dev-data/seed-rto-dashboard.sql` is an optional, idempotent local development seed for demo platforms, schedules, users, role assignments, and current-week office days; it is not a Flyway migration.
- `V9__create_work_schedules.sql` creates named work schedules and adds the nullable `users.work_schedule_id` relationship with `ON DELETE SET NULL`.
- `V10__create_events.sql` creates global/platform events with a platform foreign key that cascades on platform deletion.

- `pom.xml` — project coordinates, Java and Spring Boot versions, dependencies, and Maven build plugin.
- `src/main/java/com/rtotracker/backend/SpringBackendApplication.java` — Spring Boot application entry point.
- `src/main/resources/application.properties` — application name and runtime configuration.
- `AGENTS.md` — local backend maintenance guidance.
- `.gitignore` — excludes Maven build output and IDE files.

## Commands

Run these from `spring-backend/`:

- `mvn spring-boot:run` — start the API.
- `mvn test` — run tests.
- `mvn package` — package the runnable JAR.

## Current implementation state

- User records and role assignments are persisted through Spring Data JPA and MySQL, with Flyway managing schema changes. User request emails must have a dotted domain. New users provide a password, and `PasswordHashingService` stores a BCrypt hash with a generated per-password salt; user and auth responses expose email and role codes.
- Flyway migration `V6__create_platforms.sql` creates platforms and the legacy membership table; `V7__assign_each_user_to_at_most_one_platform.sql` adds the nullable platform foreign key and retains the lowest-ID platform when legacy data has multiple memberships. Deleting a platform clears its users' membership, and user email edits preserve platform membership.
- Database connection values are configurable through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
- API limits default to 120 requests per minute per signed-in account or unauthenticated client IP, plus 50 login requests per 15 minutes per IP. `RATE_LIMIT_MAX_BUCKETS` bounds tracked buckets (default 100,000). Set `RATE_LIMIT_TRUSTED_PROXIES` to trusted proxy IPs/CIDRs before using forwarded client addresses; untrusted `X-Forwarded-For` values are ignored.
- Activate the `prod` profile in production. It requires explicit database and frontend origin values, enables secure session cookies, and suppresses default error details. Session cookies are HTTP-only, SameSite Lax, and expire after 30 minutes. Use a shared store or gateway-level limiter before running multiple backend instances.
- Platform and work-schedule user selection share email normalization and existence validation in `UserSelectionService`; each service still applies its own one-assignment rule.
- `/api/users` (general roster), `GET /api/users/{email}`, `GET /api/roles`, and `GET /api/office-days/platform/attendance` have no current frontend callers. Keep these endpoints until external API consumers and compatibility requirements are confirmed.
- The dashboard week query scans by `office_date`, but the current schema only retains the unique `(user_email, office_date)` index. Measure query plans on representative production data before adding a replacement date-leading index.
- `POST /api/auth/login` verifies BCrypt credentials and establishes an HTTP session. Every user CRUD endpoint requires an authenticated `SUPER_ADMIN` session.
- Office-day records use one `DATE` row per user and date. `(user_email, office_date)` supports a user's month query and enforces uniqueness. Office-day reads and writes identify the owner from the authenticated session.
- The frontend reverse-proxies `/api/*` to the backend, so its browser API requests remain same-origin. Direct cross-origin API requests are allowed from `FRONTEND_ORIGIN` (default `http://localhost:3000`) with credentials.
- The assistant token endpoint validates the Spring session before issuing a short-lived JWT. The context endpoint derives the email from the verified token, then returns visible event fields and aggregate team counts without colleague email addresses.
- `target/` contains generated Maven output and is not source.
