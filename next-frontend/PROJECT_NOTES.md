# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes.

## What this project is

- A Next.js web frontend in this directory.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router routes: `/` is implemented in `app/page.tsx`; `/login` is implemented in `app/login/page.tsx` with its form in `app/login/login-form.tsx`; people administration lives under `/manage/{users,platforms,work-schedules,sites}` with URL-backed tabs. The previous `/users`, `/platforms`, `/work-schedules`, and `/sites` paths redirect to their matching management tab. The root layout is in `app/layout.tsx`.
- `package.json` and `package-lock.json` specify Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9`, React Hook Form, the Zod resolver, and Zod.
- shadcn CLI `^4.22.1` configures the Nova/Radix preset in `components.json` and generates local UI components. Theme variables and imports live in `app/globals.css`.

## Key files

- `app/page.tsx` â€” planner route (`/`); Server Component that renders the planner.
- `app/users/user-management.tsx` owns the preview roster; `user-editor-sheet.tsx` and `user-editor-form.tsx` provide the shared add/edit sheet and form.
- `/manage/platforms` and `/manage/work-schedules` are URL-backed tabs in the shared People & assignments area. Their admin lists send debounced name searches to the backend and paginate matching results client-side (10, 25, or 50 rows). Editors manage group names only; user assignments are managed in Manage Users. Platform names are limited to 20 characters; work schedule names are limited to 10 characters and unique without regard to letter case. Users can belong to zero or one of each group.
- `/dashboard` is implemented in `app/dashboard/`; it reports saved office-day attendance for a selected Monday–Friday week with five unwrapped daily attendance cards and group-by-day matrices with highlighted daily totals, per-group week sums, and a grand total. The matrices render as cards on mobile and stacked platform/work-schedule group-row, weekday-column tables with matching fixed column widths on larger screens. The route and reporting API are available to ADMIN and SUPER_ADMIN roles.
- `/lunch` is implemented in `app/lunch/` for roster preview, one-action locking, and scanner-based receipt marking. It is available to LUNCH and SUPER_ADMIN users. The Site selector sits above the lunch date; Site and date together identify the lock and scope the preview, breakdown, roster, and scans. Locked roster rows show the authenticated handout operator email for marked receipts. On locked lunches, the overview and roster sit beside a sticky scanner panel at wide desktop sizes; smaller screens stack the content. Credential input submits on Enter; manual entry also has a Check scan button. Procurement uses debounced email search and server-paginated roster rows, with separate options and locked-snapshot endpoints. The included-users header keeps the full roster count while platform, work-schedule, status, and search filters narrow the rows shown. Locked summaries show received/total counts and roster rows show Received/Pending badges with a server-side status filter.
- `/events` is implemented in `app/events/`; SUPER_ADMIN users create, edit, and delete global or platform-scoped events, while ADMIN users assigned to a platform manage only that platform's events. The management list searches event fields and platform name on the backend, supports an optional clearable date filter, then paginates matching results with selectable page sizes (10, 25, or 50). The planner shows upcoming events in chronological order by default and provides a month-scoped toggle to reveal past events, with a day-of-month marker highlighted for today, a Global or platform-name scope badge, and time/location details.
- Platform, Site, and Work Schedule list rows show each group's user count. Their editors manage group names only; assignments are managed in Manage Users.
- `components/SidebarPageLayout.tsx` provides the shared sidebar shell and page header; routes pass their header content as a prop. `components/ui/sidebar.tsx` persists the expanded/collapsed preference in a cookie and restores it when a route mounts.
- `components/InlineNotification.tsx` renders shared success/error inline notices; the dismiss button is optional, and notices may include an action such as retry.
- `components/PaginationControls.tsx` standardizes page-size selection, page counts, and Previous/Next buttons with arrows across paginated management lists.
- `app/login/login-form.tsx` â€” client-side login form using shadcn UI components and Zod validation; submits to the Spring API and includes the HTTP session cookie.
- `api/` â€” frontend API clients (login, current user, logout, assistant), server-side Spring and AI service proxy rewrites, backend URL, and session-check helpers.
- `providers/AuthProvider.tsx` â€” app-wide client auth context exposing current user, loading/authenticated/logout-pending state, refresh, and logout through `useAuth()`.
- Route-scoped providers in `providers/` own admin data loading, mutations, modal selection, and errors for Manage People, `/events`, and `/dashboard`; their page components focus on rendering and local view/form state.
- `validation/` â€” Zod schemas and inferred form value types, organized by form.
- `app/component/OfficePlanner.tsx` composes the schedule page; `ScheduleProvider.tsx` owns month data, loading/saving, and planner actions shared through `useSchedule()`. It loads personal office days and platform attendance counts together from the monthly schedule endpoint, reloads the active month when authenticated user data refreshes, and clears cached data when the account changes. Calendar cells show the saved daily count for other members of the user's platform, excluding the signed-in user. Selecting a date opens `PlatformOfficeDays.tsx`, which shows saved office plans by email for other members of the platform.
- `app/component/RtoAssistant.tsx` provides a floating lower-right chat popup only on `/`, through `api/assistant.ts`; its mobile view uses a modal backdrop, while desktop keeps a transparent click-through backdrop so the calendar remains visible. The client gets a short-lived assistant JWT from Spring and posts up to eight recent chat turns (up to 6,000 characters) to same-origin /api/assistant/chat. Next.js reverse-proxies chat to server-configured AI_SERVICE_URL (default http://127.0.0.1:8010) and other /api/* requests to Spring. Bedrock may choose read-only tools for the user's saved office days, visible events, and aggregate attendance. Read-only data covers the first of the current month through the end of next month; past records are described as historical, and new suggestions begin tomorrow and are not saved. Assistant API errors are mapped to concise messages in the chat; detailed Bedrock diagnostics stay in the service logs.
- `components/Sidebar.tsx` â€” shared AC Manila navigation and authenticated email profile menu with logout.
- `components/sidebar/ProfileMenu.tsx` displays the authenticated user's optional platform name below their email; `/api/auth/me` returns a singular nullable `platform` object.
- `/manage/users` requires a valid session; SUPER_ADMIN users can manage the full roster, while platform-assigned ADMIN users can read only their platform's roster. The backend scopes `/api/users/manage` to the caller's platform for ADMIN and keeps all mutations SUPER_ADMIN-only. The page loads users from paginated `/api/users/manage` and fetches role, platform, work-schedule, and Site filter choices together from `/api/users/manage/filters`. Search and filters apply across pages on the backend. SUPER_ADMINs can select users across roster pages and batch update platform, work schedule, Site, and roles through `/api/users/manage/assignments`; each assignment supports no change, set, or clear, and role replacement is explicit. Protected users cannot be selected for batch edits. The UI supports refresh, page navigation, and selectable limits (10, 25, 50, or 100). Other roster callers continue to use `/api/users`.
- For CRUD screens, use `hooks/use-crud-search.ts` for shared 300 ms debounced search state and send its query to the backend list endpoint; do not filter only the already-loaded result set. Follow the `/manage` tabs for responsive card-based layouts, paginated lists with selectable page sizes, shared add/edit sheets, dismissible success notices via `components/CrudActionNotice.tsx`, and confirmation dialogs for deletes. In mobile filter rows, keep dropdowns content-width and allow them to wrap while the search input uses the full row. Add a route-scoped provider for data loading, API mutations, and shared loading/error/notice state; keep rendering and transient form state in UI components.
- The sidebar shows lunch procurement to users with the `LUNCH` or `SUPER_ADMIN` role, the RTO dashboard to users with the `ADMIN` or `SUPER_ADMIN` role, Manage events to SUPER_ADMIN users or ADMIN users with a platform assignment, and Manage people to SUPER_ADMIN users or platform-assigned ADMIN users. The Manage People tabs expose Users to ADMIN users and all four sections to SUPER_ADMIN users; platform, schedule, and Site management remain SUPER_ADMIN-only.
- `components/ui/sidebar.tsx` â€” shadcn responsive sidebar primitives; `hooks/use-mobile.ts` supplies its mobile breakpoint.
- `app/component/` â€” route-scoped planner and sections: heading, monthly summary, calendar, and event requirements.
- `app/layout.tsx` â€” root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` â€” imports Tailwind and shadcn styles, and defines base theme variables.
- `components/ui/` â€” shadcn-generated Button, Card, Badge, Input, Label, AlertDialog, Alert, DropdownMenu, and other shared UI components.
- Use shadcn components from `components/ui/` for frontend UI controls and layout every time. If a needed component is missing, add it with the shadcn CLI instead of writing a native HTML control or custom replacement.
- Standard for data-fetching UI: show layout-matched skeletons anywhere fetched content is pending, including initial loads and refreshes. Use `components/ui/skeleton.tsx`, keep placeholders in the same card or list region as the loaded content, and mark the loading region with an accessible status and busy state. Show fetch failures with `components/DataLoadError.tsx` and provide a retry action for the failed read.
- `components.json` â€” shadcn preset, aliases, and style configuration.
- `lib/utils.ts` â€” shared class name utility.
- `next.config.ts` â€” Next config that registers the proxy rewrite from `api/proxy.ts`, plus Tailwind's Turbopack CSS loader.
- `tsconfig.json` â€” strict TypeScript, bundler resolution, `@/*` maps to the frontend root.
- `eslint.config.mjs` â€” flat ESLint config using `eslint-config-next/core-web-vitals` and `/typescript`.
- `AGENTS.md` â€” local Next.js instructions; read relevant docs under `node_modules/next/dist/docs/` before changing Next.js APIs or conventions.
- `.gitignore` â€” ignores framework/build output, dependencies, local env files, and editor/OS artifacts.

## Commands

- `npm run dev` â€” development server.
- `npm run build` â€” production build.
- `npm run start` â€” serve the production build.
- `npm run lint` â€” ESLint.

## Current implementation state

- The root, Manage People, legacy management redirects, and `/login` routes are guarded by the root `proxy.ts`, which reads the backend session through `/api/auth/me` and redirects based on authentication state. Manage People server pages independently restrict user roster access to SUPER_ADMIN or platform-assigned ADMIN and group management to SUPER_ADMIN; the backend independently protects every mutation. `AuthProvider` exposes the current user and auth actions across client components, including the sidebar profile and logout. Next.js rewrites `/api/assistant/chat` to server-configured `AI_SERVICE_URL` (default `http://127.0.0.1:8010`) and all other `/api/*` requests to `BACKEND_API_URL` (default `http://localhost:8080`), preserving same-origin browser requests.

- Use React Hook Form `Controller` for form fields, with Zod schemas and the Zod resolver for validation.


- The root page is an interactive RTO planner; it defaults to the current client month, uses a hydration-safe placeholder until the client date is ready, and loads/saves schedules per month. Unsaved edits remain client-side drafts. Today and past dates are locked in the calendar and bulk actions affect only future dates. Calendar events come from the backend and are filtered by the signed-in user's platform.
- `components/sidebar/ProfileMenu.tsx` and `components/sidebar/utils.ts` contain the authenticated profile menu/logout behavior and email initials helper, respectively.
- Root metadata and planner use a PwC-inspired orange and charcoal internal-tool theme.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When work changes architecture, routes, data flow, integrations, or conventions, update the relevant section here.

- `api/office-days.ts` loads the authenticated user's monthly schedule and same-platform daily counts together, replaces the editable future portion of the monthly schedule, and loads colleagues' plans for a selected date through the same-origin API proxy. The planner keeps unsaved edits in client state and persists them with the backend on Save.
- `api/users.ts` loads, creates, updates, and deletes backend users through the same-origin API proxy without caching list requests.
- `api/platforms.ts` loads platform summaries with member counts and platform filter options; platform CRUD manages names only.
- `api/work-schedules.ts` loads work schedule summaries with user counts and manages names through the same-origin API proxy.
- `api/events.ts` loads calendar-visible events and manages events through the same-origin API proxy.
- `api/rto-dashboard.ts` loads the ADMIN/SUPER_ADMIN weekly saved-office-day summary through the same-origin API proxy.
- `api/lunch.ts` loads the selected lunch summary, queries server-paginated roster rows and filter options, locks all users, and posts scanned credentials through the same-origin API proxy.
- `providers/UserManagementProvider.tsx`, `PlatformManagementProvider.tsx`, `WorkScheduleManagementProvider.tsx`, and `RtoDashboardProvider.tsx` keep route-specific API state and actions outside page UI; each is mounted by its route's client screen.
- Effect-driven API reads accept an optional `AbortSignal`; each effect creates an `AbortController`, passes its signal through the API client, and aborts it during cleanup to stop stale requests.
- Standard for future effects: every effect-started asynchronous request must create an `AbortController`, pass `controller.signal` to the API client, abort in the effect cleanup, and skip state updates or error reporting after `signal.aborted` becomes true. API client read methods should accept an optional `AbortSignal` when used by effects.
- `hooks/use-debounced-value.ts` provides the base debounce utility; `hooks/use-crud-search.ts` provides shared CRUD-list search state and a 300 ms debounce before server queries.
- `/manage/sites` is a URL-backed tab in the shared People & assignments area. SUPER_ADMIN users can list, create, edit, and delete Sites. The list searches server-side and paginates locally. Editors manage Site names only; user assignments are managed in Manage Users. Names are limited to 25 characters and unique without regard to letter case; each user can belong to zero or one Site. Deleting a Site leaves users unassigned.
- Manage Users includes a Site filter with an unassigned option and shows each user's Site. The SUPER_ADMIN account editor can assign or clear a Site.
- `/dashboard` has a prominent Site filter above the week selector. It narrows daily attendance and all platform/work-schedule breakdown totals to all Sites or one Site.
