# Project Notes

This file is the short working map for `spring-backend`. Read it before backend work and update it when structure, dependencies, endpoints, configuration, or conventions change.

## What this project is

- A standalone Spring Boot REST API built with Maven.
- Spring Boot `4.1.1`, Java `25`, Spring MVC, Spring Data JPA, MySQL, Flyway, and springdoc OpenAPI are configured in `pom.xml`.
- Flyway creates the `users` table with email as its primary key and adds a nullable BCrypt password hash for compatibility with existing records; Hibernate validates the mapped entity.
- The API exposes CRUD endpoints under `/api/users`.
- Swagger UI is available at `/swagger-ui.html`; startup prints its URL.
- The default HTTP port is `8080`.

## Key files

- `src/main/java/com/rtotracker/backend/user/` contains the user entity, repository, service, and CRUD controller.
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

- User records are persisted through Spring Data JPA and MySQL, with Flyway managing schema changes. User request emails must have a dotted domain. New users provide a password, and `PasswordHashingService` stores a BCrypt hash with a generated per-password salt; API responses expose email only.
- Database connection values are configurable through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
- The API has no authentication configured; CRUD endpoints are public.
- `target/` contains generated Maven output and is not source.
