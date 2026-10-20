# Project Notes

This repository contains the RTO Tracker frontend and backend as separate applications.

- `REQUIREMENTS.md` is the shared source of truth for user types, access rules, feature behavior, system boundaries, and unresolved product questions. Update it with changes to user-visible behavior or permissions.

## Projects

- `next-frontend/` — Next.js App Router frontend. Read its `AGENTS.md` and `PROJECT_NOTES.md` before frontend work; npm commands and UI details are documented there.
- `spring-backend/` — Maven and Spring Boot REST API. Read its `AGENTS.md` and `PROJECT_NOTES.md` before backend work; Java structure and Maven commands are documented there.
- The frontend Next.js server reverse-proxies `/api/*` to Spring using `BACKEND_API_URL` (default `http://localhost:8080`), checks session state through `GET /api/auth/me` for route guards and the sidebar profile, and invalidates the session through `POST /api/auth/logout`; Spring also has global credentialed CORS for direct API requests.
- Platform membership is managed in the frontend at `/platforms` and persisted by Spring's authenticated `/api/platforms` CRUD endpoints.

## Repository conventions

- Each application has its own dependencies, run commands, and README.
- Run frontend commands from `next-frontend/` and Maven commands from `spring-backend/`.
- Build output and dependencies are local generated files, not source.
