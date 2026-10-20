# Spring Backend

Standalone Spring Boot REST API for the RTO Tracker. See `PROJECT_NOTES.md` for the package map and current implementation state.

## Requirements

- Java 25 or later
- Maven 3.6.3 or later

## Run

From this directory, start the app with:

```powershell
mvn spring-boot:run
```

Spring Boot DevTools is enabled for development. The repository's VS Code workspace enables Java auto-build, so saving Java changes recompiles classes and restarts an app running with `mvn spring-boot:run`. Other IDEs must compile changed classes; you can also run `mvn compile` manually. DevTools is not included in the packaged JAR, so `java -jar` does not use automatic restart.

The API listens on `http://localhost:8080`. Authentication endpoints are `POST /api/auth/login`, `GET /api/auth/me` (returns 401 without a valid session), and `POST /api/auth/logout` (invalidates the session). In local development, the Next.js frontend proxies `/api/*` to this server, so browser requests use the frontend origin. Global API CORS is also enabled for `FRONTEND_ORIGIN` (default `http://localhost:3000`) to support direct cross-origin requests.

Build a runnable JAR with `mvn package`, then run it with `java -jar target/spring-backend-0.0.1-SNAPSHOT.jar`.
