# Project Notes

This repository contains the RTO Tracker frontend and backend, plus a standalone Bedrock AI service for experimenting with Nova Micro.

- `REQUIREMENTS.md` is the shared source of truth for user types, access rules, feature behavior, system boundaries, and unresolved product questions. Update it with changes to user-visible behavior or permissions.

## Projects

- `next-frontend/` — Next.js App Router frontend. Read its `AGENTS.md` and `PROJECT_NOTES.md` before frontend work; npm commands and UI details are documented there.
- `spring-backend/` — Maven and Spring Boot REST API. Read its `AGENTS.md` and `PROJECT_NOTES.md` before backend work; Java structure and Maven commands are documented there.
- `bedrock-ai-service/` — FastAPI chat service for Amazon Nova Micro. Bedrock can choose read-only tools for visible events, other platform members' daily RTO counts, and the user's saved office days. Python validates inputs and calls fixed Spring endpoints using a short-lived JWT. Read-only data covers the first of the current month through the end of next month; new suggestions begin tomorrow, and there are no write tools.
- The frontend Next.js server reverse-proxies `/api/assistant/chat` to the AI service using server-only `AI_SERVICE_URL` (default `http://127.0.0.1:8010`) and other `/api/*` routes to Spring using `BACKEND_API_URL` (default `http://localhost:8080`). It checks session state through `GET /api/auth/me` for route guards and the sidebar profile, and invalidates the session through `POST /api/auth/logout`; Spring also has global credentialed CORS for direct API requests.
- The planner assistant obtains a short-lived token from Spring `POST /api/auth/assistant-token`, then posts to the frontend same-origin /api/assistant/chat route, which Next.js reverse-proxies to AI_SERVICE_URL. Bedrock can choose read-only Spring tools for visible events, daily attendance counts, and saved office days; Spring scopes results to the verified user and allows reads from the first of the current month through next-month end. Past results are historical; planning suggestions begin tomorrow; recent chat turns are sent as conversation context.
- People administration is grouped at `/manage` with URL-backed tabs for users, platforms, work schedules, and Sites; old management paths redirect to their matching tab. User memberships are assigned in Manage Users and persisted through `/api/users`. A user can belong to at most one platform; the platform foreign key is nullable on `users`.
- Signed-in `USER` accounts assigned to a platform see daily saved attendance counts for colleagues in calendar cells and can select a date to see their saved office plans; the backend derives platform membership from the caller's authenticated account and excludes the caller from both views. The monthly schedule endpoint returns both personal office days and platform attendance counts in one response.
- Events are managed by SUPER_ADMIN users at `/events` through Spring's `/api/events` endpoints. Global events are visible to all signed-in users; platform events are visible only to users assigned to that platform. Deleting a platform cascades to its events.
- The SUPER_ADMIN RTO dashboard at `/dashboard` reports saved office-day plans for a selected Monday–Friday week, with daily totals and breakdowns by current platform and work schedule.
- Users with the `LUNCH` or `SUPER_ADMIN` role manage daily free-lunch procurement at `/lunch`. Site and date together identify a lock, allowing separate Sites to be locked on the same date; there is no All Sites option. The Site selector scopes the preview, breakdown, roster, lock, and credential scans. Platform and work-schedule filters only narrow the roster list. Spring persists the Site/date lock, recipient list, receipt status, and authenticated handout operator email through `/api/lunch`.

## Repository conventions

- Each application has its own dependencies, run commands, and README.
- Run frontend commands from `next-frontend/` and Maven commands from `spring-backend/`.
- Build output and dependencies are local generated files, not source.
- Sites are managed at `/manage/sites`; user assignments are managed in Manage Users. Each Site has a unique name up to 25 characters and can have multiple users; each user can belong to zero or one Site through nullable `users.site_id`, cleared when its Site is deleted.
- Manage Users includes Site assignment in its server-side filters and account editor; SUPER_ADMIN users can assign or clear a user's Site directly.
- The RTO dashboard has a Site filter above the week selector; it filters daily attendance and all platform/work-schedule breakdown totals to all Sites or one Site.
