# Project Notes

This repository contains the RTO Tracker frontend and backend as separate applications.

- `REQUIREMENTS.md` is the shared source of truth for user types, access rules, feature behavior, system boundaries, and unresolved product questions. Update it with changes to user-visible behavior or permissions.

## Projects

- `next-frontend/` — Next.js App Router frontend. Read its `AGENTS.md` and `PROJECT_NOTES.md` before frontend work; npm commands and UI details are documented there.
- `spring-backend/` — Maven and Spring Boot REST API. Read its `AGENTS.md` and `PROJECT_NOTES.md` before backend work; Java structure and Maven commands are documented there.
- The frontend Next.js server reverse-proxies `/api/*` to Spring using `BACKEND_API_URL` (default `http://localhost:8080`), checks session state through `GET /api/auth/me` for route guards and the sidebar profile, and invalidates the session through `POST /api/auth/logout`; Spring also has global credentialed CORS for direct API requests.
- Platform membership is managed in the frontend at `/platforms` and persisted by Spring's authenticated `/api/platforms` CRUD endpoints. A user can belong to at most one platform; the platform foreign key is nullable on `users`.
- Signed-in `USER` accounts assigned to a platform see daily saved attendance counts for colleagues in calendar cells and can select a date to see their saved office plans; the backend derives platform membership from the caller's authenticated account and excludes the caller from both views. The monthly schedule endpoint returns both personal office days and platform attendance counts in one response.
- Work schedules are managed at `/work-schedules` and persisted by Spring's authenticated `/api/work-schedules` CRUD endpoints. A user can have zero or one work schedule; the nullable `users.work_schedule_id` foreign key is cleared if the work schedule is deleted.
- Events are managed by SUPER_ADMIN users at `/events` through Spring's `/api/events` endpoints. Global events are visible to all signed-in users; platform events are visible only to users assigned to that platform. Deleting a platform cascades to its events.
- The SUPER_ADMIN RTO dashboard at `/dashboard` reports saved office-day plans for a selected Monday–Friday week, with daily totals and breakdowns by current platform and work schedule.

## Repository conventions

- Each application has its own dependencies, run commands, and README.
- Run frontend commands from `next-frontend/` and Maven commands from `spring-backend/`.
- Build output and dependencies are local generated files, not source.
