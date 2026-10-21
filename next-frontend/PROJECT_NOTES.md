# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes.

## What this project is

- A Next.js web frontend in this directory.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router routes: `/` is implemented in `app/page.tsx`; `/login` is implemented in `app/login/page.tsx` with its form in `app/login/login-form.tsx`; `/users` is implemented in `app/users/page.tsx` with the interactive admin user manager in `app/users/user-management.tsx`. The root layout is in `app/layout.tsx`.
- `package.json` and `package-lock.json` specify Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9`, React Hook Form, the Zod resolver, and Zod.
- shadcn CLI `^4.22.1` configures the Nova/Radix preset in `components.json` and generates local UI components. Theme variables and imports live in `app/globals.css`.

## Key files

- `app/page.tsx` â€” planner route (`/`); Server Component that renders the planner.
- `app/users/user-management.tsx` owns the preview roster; `user-editor-sheet.tsx` and `user-editor-form.tsx` provide the shared add/edit sheet and form.
- `/platforms` is implemented in `app/platforms/`; its admin list loads platform summaries with user counts in one query and paginates the filtered results client-side (10, 25, or 50 rows). It loads the user roster and member details only when the editor opens. The editor's user search filters the loaded roster after a 300 ms debounce. Platform names are required and limited to 20 characters. The editor prevents assigning users who belong to another platform; each user may belong to at most one platform.
- `/work-schedules` is implemented in `app/work-schedules/`; SUPER_ADMIN users can create, edit, list, and delete named work schedules and assign users. Names are limited to 10 characters, and each user can belong to zero or one work schedule. Deleting a schedule leaves its users unassigned.
- `/dashboard` is implemented in `app/dashboard/`; it reports saved office-day attendance for a selected Monday–Friday week with daily totals, weekly platform/work schedule totals, and day-by-group matrices with highlighted daily totals, per-group week sums, and a grand total. The route and reporting API are SUPER_ADMIN-only.
- Platform list rows show each group's user count; member email addresses are managed in the edit sheet and are not displayed in the list.
- `components/SidebarPageLayout.tsx` provides the shared sidebar shell and page header; routes pass their header content as a prop. `components/ui/sidebar.tsx` persists the expanded/collapsed preference in a cookie and restores it when a route mounts.
- `app/login/login-form.tsx` â€” client-side login form using shadcn UI components and Zod validation; submits to the Spring API and includes the HTTP session cookie.
- `api/` â€” frontend API client (login, current user, logout), backend proxy rewrite, backend URL, and session-check helpers.
- `providers/AuthProvider.tsx` â€” app-wide client auth context exposing current user, loading/authenticated/logout-pending state, refresh, and logout through `useAuth()`.
- `validation/` â€” Zod schemas and inferred form value types, organized by form.
- `app/component/OfficePlanner.tsx` composes the schedule page; `ScheduleProvider.tsx` owns month data, loading/saving, and planner actions shared through `useSchedule()`. It reloads the active month when authenticated user data refreshes and clears cached data when the account changes.
- `components/Sidebar.tsx` â€” shared AC Manila navigation and authenticated email profile menu with logout.
- `components/sidebar/ProfileMenu.tsx` displays the authenticated user's optional platform name below their email; `/api/auth/me` returns a singular nullable `platform` object.
- `/users` requires a valid session; its server page returns the route-level 404 UI to users without the `SUPER_ADMIN` role. The backend also protects all `/api/users` operations. The page loads users from the paginated `/api/users/manage` endpoint and loads platform filter options once from `/api/platforms/options`; paging, filtering, and refresh requests do not reload filter options. The UI supports refresh, page navigation, selectable limits (10, 25, 50, or 100), filtering by platform across pages, and search within the current page. Each user row shows their platform above their roles. Add, edit, and delete are connected; edits update email and assignable roles while preserving the password and linked office-day records, and protected users and roles cannot be changed. Self-delete is blocked in the UI and backend. The platform editor continues to use `/api/users` for roster-only queries.
- For future CRUD screens, follow `/users` and `/platforms` for responsive card-based layouts, debounced search, paginated lists with selectable page sizes, shared add/edit sheets, dismissible success notices via `components/CrudActionNotice.tsx`, and confirmation dialogs for deletes; adapt the layout for mobile and desktop.
- The sidebar shows the RTO dashboard, user, platform, and work schedule management routes only to users with the `SUPER_ADMIN` role.
- `components/ui/sidebar.tsx` â€” shadcn responsive sidebar primitives; `hooks/use-mobile.ts` supplies its mobile breakpoint.
- `app/component/` â€” route-scoped planner and sections: heading, monthly summary, calendar, and event requirements.
- `app/layout.tsx` â€” root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` â€” imports Tailwind and shadcn styles, and defines base theme variables.
- `components/ui/` â€” shadcn-generated Button, Card, Badge, Input, Label, AlertDialog, Alert, DropdownMenu, and other shared UI components.
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

- The root, `/users`, and `/login` routes are guarded by the root `proxy.ts`, which reads the backend session through `/api/auth/me` and redirects based on authentication state. The `/users` server page renders its 404 boundary for authenticated users without `SUPER_ADMIN`; the backend independently protects every `/api/users` operation. `AuthProvider` exposes the current user and auth actions across client components, including the sidebar profile and logout. A Next.js rewrite reverse-proxies `/api/*` to `BACKEND_API_URL` (default `http://localhost:8080`), preserving the backend session cookie without browser CORS.

- Use React Hook Form `Controller` for form fields, with Zod schemas and the Zod resolver for validation.


- The root page is an interactive RTO planner; schedules load from and save to the backend per month, and unsaved edits are kept as client-side drafts. Event notices are illustrative until connected to a company calendar or backend.
- `components/sidebar/ProfileMenu.tsx` and `components/sidebar/utils.ts` contain the authenticated profile menu/logout behavior and email initials helper, respectively.
- Root metadata and planner use a PwC-inspired orange and charcoal internal-tool theme.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When work changes architecture, routes, data flow, integrations, or conventions, update the relevant section here.

- `api/office-days.ts` loads and replaces the authenticated user's monthly schedule through the same-origin API proxy. The planner keeps unsaved edits in client state and persists them with the backend on Save.
- `api/users.ts` loads, creates, updates, and deletes backend users through the same-origin API proxy without caching list requests.
- `api/platforms.ts` loads platform summaries with member counts, platform filter options, and platform details; the platform editor fetches member details and the user roster only when opened.
- `api/work-schedules.ts` loads, creates, updates, and deletes work schedules through the same-origin API proxy.
- `api/rto-dashboard.ts` loads the SUPER_ADMIN weekly saved-office-day summary through the same-origin API proxy.
- `hooks/use-debounced-value.ts` delays local search filtering by 300 ms; `/users` and `/platforms` use it for their search inputs.
