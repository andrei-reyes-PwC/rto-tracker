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

The assistant uses the current login session to issue a five-minute RS256 token at `POST /api/auth/assistant-token`. After installing the AI service dependencies, generate local keys once from the repository root with `bedrock-ai-service/.venv/Scripts/python.exe bedrock-ai-service/scripts/generate_local_jwt_keys.py`. Spring reads its private and public keys from `spring-backend/.secrets/` by default; the private key stays in Spring, while the AI service reads the public key. `JWT_ISSUER` and `JWT_AUDIENCE` must match between Spring and the AI service. The AI can use protected read-only `GET /api/assistant/tools/events`, `/rto-member-counts`, and `/my-schedule` endpoints. They derive the caller from the token and allow dates from today through the end of next month.

All `/api/**` routes use in-memory request limits. Defaults are 120 requests per minute for signed-in accounts or unauthenticated client IPs, with an additional limit of 50 login requests per 15 minutes per IP. Rejections return `429` and a `Retry-After` header. The bucket map is bounded by `RATE_LIMIT_MAX_BUCKETS` (default 100,000); if it fills before expired entries can be reclaimed, new buckets receive `503` until capacity is available. Counters reset when the process restarts, so run one backend instance when using this store.

When running behind a reverse proxy, set `RATE_LIMIT_TRUSTED_PROXIES` to its IP or CIDR (comma-separated for multiple proxies), for example `127.0.0.1,::1`. Only when the immediate peer is trusted will the API use `X-Forwarded-For`; configure the edge proxy to replace or append that header safely. If the API sees only the Next.js server address, unauthenticated traffic shares that IP bucket until the proxy is configured.

For production, activate the `prod` profile and provide `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `FRONTEND_ORIGIN`. The profile requires explicit database connection settings, enables secure HTTP-only session cookies, and suppresses default error details. State-changing API requests with an `Origin` header (or `Referer` when Origin is absent) are accepted only from `FRONTEND_ORIGIN`; requests without either header remain available for non-browser clients. If the backend is scaled beyond one process or instance, replace the in-memory rate-limit store with a shared store or enforce limits at the shared gateway.

Build a runnable JAR with `mvn package`, then run it with `java -jar target/spring-backend-0.0.1-SNAPSHOT.jar`.
