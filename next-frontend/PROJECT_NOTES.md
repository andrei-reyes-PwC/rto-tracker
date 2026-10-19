# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes.

## What this project is

- A Next.js web frontend in this directory.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router routes: `/` is implemented in `app/page.tsx`; `/login` is implemented in `app/login/page.tsx` and `app/login/login-form.tsx`. The root layout is in `app/layout.tsx`.
- `package.json` and `package-lock.json` specify Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9`, React Hook Form, the Zod resolver, and Zod.
- shadcn CLI `^4.22.1` configures the Nova/Radix preset in `components.json` and generates local UI components. Theme variables and imports live in `app/globals.css`.

## Key files

- `app/page.tsx` â€” planner route (`/`); Server Component that renders the planner.
- `app/login/login-form.tsx` â€” client-side login form using shadcn UI components and Zod validation; submits to the Spring API and includes the HTTP session cookie.
- `api/` â€” frontend API client, backend proxy rewrite, backend URL, and session-check helpers.
- `validation/` â€” Zod schemas and inferred form value types, organized by form.
- `app/component/OfficePlanner.tsx` â€” route-specific interactive planner; browser schedule storage and the current client date are read through `useSyncExternalStore`.
- `components/Sidebar.tsx` â€” shared AC Manila navigation/profile built on shadcn's responsive Sidebar component.
- `components/ui/sidebar.tsx` â€” shadcn responsive sidebar primitives; `hooks/use-mobile.ts` supplies its mobile breakpoint.
- `app/component/` â€” route-scoped planner and sections: heading, monthly summary, calendar, and event requirements.
- `app/layout.tsx` â€” root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` â€” imports Tailwind and shadcn styles, and defines base theme variables.
- `components/ui/` â€” shadcn-generated Button, Card, Badge, Input, Label, Alert, and other shared UI components.
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

- The root and `/login` routes are guarded by the root `proxy.ts`, which validates the backend session through `/api/auth/me` and redirects based on authentication state. A Next.js rewrite reverse-proxies `/api/*` to `BACKEND_API_URL` (default `http://localhost:8080`), preserving the backend session cookie without browser CORS.

- Use React Hook Form `Controller` for form fields, with Zod schemas and the Zod resolver for validation.


- The root page is an interactive RTO planner; schedule selections are stored in browser local storage by month, and event notices are illustrative until connected to a company calendar or backend.
- Root metadata and planner use a PwC-inspired orange and charcoal internal-tool theme.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When work changes architecture, routes, data flow, integrations, or conventions, update the relevant section here.
