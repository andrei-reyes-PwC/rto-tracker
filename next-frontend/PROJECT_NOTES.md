# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes.

## What this project is

- A Next.js web frontend in this directory.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router: the only current route is `/`, implemented in `app/page.tsx`; the root layout is in `app/layout.tsx`.
- `package.json` and `package-lock.json` specify Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^9`, and `eslint-config-next` `^16.4.2`.
- shadcn CLI `^4.22.1` configures the Nova/Radix preset in `components.json` and generates local UI components. Theme variables and imports live in `app/globals.css`.

## Key files

- `app/page.tsx` — current and only route (`/`); Server Component that renders the planner.
- `app/component/OfficePlanner.tsx` — route-specific interactive planner; browser schedule storage and the current client date are read through `useSyncExternalStore`.
- `components/Sidebar.tsx` — reusable desktop sidebar, mobile navigation drawer, and mobile menu button.
- `app/component/` — route-scoped planner and sections: heading, monthly summary, calendar, and event requirements.
- `app/layout.tsx` — root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` — imports Tailwind and shadcn styles, and defines base theme variables.
- `components/ui/` — shadcn-generated Button, Card, Badge, and Input components.
- `components.json` — shadcn preset, aliases, and style configuration.
- `lib/utils.ts` — shared class name utility.
- `next.config.ts` — Next config and Tailwind's Turbopack CSS loader.
- `tsconfig.json` — strict TypeScript, bundler resolution, `@/*` maps to the frontend root.
- `eslint.config.mjs` — flat ESLint config using `eslint-config-next/core-web-vitals` and `/typescript`.
- `AGENTS.md` — local Next.js instructions; read relevant docs under `node_modules/next/dist/docs/` before changing Next.js APIs or conventions.
- `.gitignore` — ignores framework/build output, dependencies, local env files, and editor/OS artifacts.

## Commands

- `npm run dev` — development server.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint.

## Current implementation state

- The root page is an interactive RTO planner; schedule selections are stored in browser local storage by month, and event notices are illustrative until connected to a company calendar or backend.
- Root metadata and planner use a PwC-inspired orange and charcoal internal-tool theme.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When work changes architecture, routes, data flow, integrations, or conventions, update the relevant section here.
