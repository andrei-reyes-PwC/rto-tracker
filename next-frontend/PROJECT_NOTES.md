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
- `components/SidebarPageLayout.tsx` provides the shared sidebar shell and page header; routes pass their header content as a prop. `components/ui/sidebar.tsx` persists the expanded/collapsed preference in a cookie and restores it when a route mounts.
- `app/login/login-form.tsx` â€” client-side login form using shadcn UI components and Zod validation; submits to the Spring API and includes the HTTP session cookie.
- `api/` â€” frontend API client (login, current user, logout), backend proxy rewrite, backend URL, and session-check helpers.
- `providers/AuthProvider.tsx` â€” app-wide client auth context exposing current user, loading/authenticated/logout-pending state, refresh, and logout through `useAuth()`.
- `validation/` â€” Zod schemas and inferred form value types, organized by form.
- `app/component/OfficePlanner.tsx` composes the schedule page; `ScheduleProvider.tsx` owns month data, loading/saving, and planner actions shared through `useSchedule()`. It reloads the active month when authenticated user data refreshes and clears cached data when the account changes.
- `components/Sidebar.tsx` â€” shared AC Manila navigation and authenticated email profile menu with logout.
- `/users` is currently a UI preview with a sample roster saved in browser local storage; it does not call backend user-management endpoints.
- For future CRUD screens, follow `/users` for a responsive card-based layout, clear search and record actions, shared add/edit sheets, and confirmation dialogs for deletes; adapt the layout for mobile and desktop.
- The sidebar shows the user management route to signed-in users.
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

- The root, `/users`, and `/login` routes are guarded by the root `proxy.ts`, which validates the backend session through `/api/auth/me` and redirects based on authentication state. User management also checks the signed-in role in the UI; the backend enforces administrator access for every user CRUD operation. `AuthProvider` exposes the current user and auth actions across client components, including the sidebar profile and logout. A Next.js rewrite reverse-proxies `/api/*` to `BACKEND_API_URL` (default `http://localhost:8080`), preserving the backend session cookie without browser CORS.

- Use React Hook Form `Controller` for form fields, with Zod schemas and the Zod resolver for validation.


- The root page is an interactive RTO planner; schedules load from and save to the backend per month, and unsaved edits are kept as client-side drafts. Event notices are illustrative until connected to a company calendar or backend.
- `components/sidebar/ProfileMenu.tsx` and `components/sidebar/utils.ts` contain the authenticated profile menu/logout behavior and email initials helper, respectively.
- Root metadata and planner use a PwC-inspired orange and charcoal internal-tool theme.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When work changes architecture, routes, data flow, integrations, or conventions, update the relevant section here.

- `api/office-days.ts` loads and replaces the authenticated user's monthly schedule through the same-origin API proxy. The planner keeps unsaved edits in client state and persists them with the backend on Save.
