# Project Notes

This file is the short working map for `spring-backend`. Read it before backend work and update it when structure, dependencies, endpoints, configuration, or conventions change.

## What this project is

- A standalone Spring Boot REST API built with Maven.
- Spring Boot `4.1.1`, Java `25`, Spring MVC, Spring Data JPA, MySQL, Flyway, and springdoc OpenAPI are configured in `pom.xml`.
- Flyway creates the `users` table with email as its primary key, a nullable BCrypt password hash for compatibility with existing records, a role catalog, and a `user_roles` many-to-many association; Hibernate validates the mapped entities.
- The API exposes `POST /api/auth/login`, user CRUD under `/api/users`, the role catalog under `/api/roles`, and authenticated office-day queries and monthly replacement under `/api/office-days`.
- `GET /api/users` returns a Spring page ordered by email; `page` is zero-based (default `0`) and `size` defaults to `20`, with a maximum size of `100`.
- Swagger UI is available at `/swagger-ui.html`; startup prints its URL.
- The default HTTP port is `8080`.

## Key files

- `src/main/java/com/rtotracker/backend/user/` contains the user entity, repository, service, and CRUD controller.
- `src/main/java/com/rtotracker/backend/role/` contains the role entity, repository, read service, and read-only `GET /api/roles` catalog endpoint.
- User creation assigns `USER` by default; user and authentication responses include role codes. `SUPER_ADMIN` is seeded as a protected catalog role. User CRUD does not currently provide role assignment; every `/api/users` endpoint requires an authenticated `SUPER_ADMIN` session, and protected users cannot be deleted.
- `src/main/java/com/rtotracker/backend/office/` contains office-day persistence and authenticated per-user monthly schedule APIs.
- `src/main/java/com/rtotracker/backend/auth/` contains login, current-session (`GET /api/auth/me`), logout (`POST /api/auth/logout`), and credential verification; logout invalidates the HTTP session.
- `src/main/java/com/rtotracker/backend/WebCorsConfig.java` configures credentialed CORS globally for `/api/**`.
- `src/main/java/com/rtotracker/backend/ApiExceptionHandler.java` formats validation, malformed request, and application status errors as JSON responses with explanations.
- `src/main/resources/db/migration/` contains Flyway schema migrations.

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
- Database connection values are configurable through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
- `POST /api/auth/login` verifies BCrypt credentials and establishes an HTTP session. Every user CRUD endpoint requires an authenticated `SUPER_ADMIN` session.
- Office-day records use one `DATE` row per user and date. `(user_email, office_date)` supports a user's month query and enforces uniqueness. Office-day reads and writes identify the owner from the authenticated session.
- The frontend reverse-proxies `/api/*` to the backend, so its browser API requests remain same-origin. Direct cross-origin API requests are allowed from `FRONTEND_ORIGIN` (default `http://localhost:3000`) with credentials.
- `target/` contains generated Maven output and is not source.
