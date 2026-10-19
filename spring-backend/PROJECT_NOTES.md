# Project Notes

This file is the short working map for `spring-backend`. Read it before backend work and update it when structure, dependencies, endpoints, configuration, or conventions change.

## What this project is

- A standalone Spring Boot REST API built with Maven.
- Spring Boot `4.1.1`, Java `25`, and the Spring MVC web starter are configured in `pom.xml`.
- The app currently exposes `GET /api/hello`, returning a JSON message.
- The default HTTP port is `8080`.

## Key files

- `pom.xml` — project coordinates, Java and Spring Boot versions, dependencies, and Maven build plugin.
- `src/main/java/com/rtotracker/backend/SpringBackendApplication.java` — Spring Boot application entry point.
- `src/main/java/com/rtotracker/backend/HelloController.java` — sample REST endpoint and response record.
- `src/main/resources/application.properties` — application name and runtime configuration.
- `AGENTS.md` — local backend maintenance guidance.
- `.gitignore` — excludes Maven build output and IDE files.

## Commands

Run these from `spring-backend/`:

- `mvn spring-boot:run` — start the API.
- `mvn test` — run tests.
- `mvn package` — package the runnable JAR.

## Current implementation state

- No persistence, authentication, or connection to the frontend is configured yet.
- `target/` contains generated Maven output and is not source.
