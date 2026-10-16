# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes. Treat configuration recorded here as a map, and confirm current values in the relevant source/config file when they matter.

## What this project is

- A starter Next.js web frontend in this directory.
- `package.json` and `package-lock.json` specify Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, ESLint `^8.57.1`, and `eslint-config-next` `^14.2.35`.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router: the only current route is `/`, implemented in `app/page.tsx`; the root layout is in `app/layout.tsx`.
- Dependency declarations currently mix Next.js 16 with `eslint-config-next` 14. This is an observed version mismatch; reassess compatibility before changing or relying on lint tooling.

## Key files

- `app/page.tsx` — current and only route (`/`); still the Create Next App starter screen.
- `app/layout.tsx` — root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` — imports Tailwind and defines base theme colors.
- `next.config.ts` — Next config; enables `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, and Tailwind's Turbopack CSS loader.
- `tsconfig.json` — strict TypeScript, bundler resolution, `@/*` maps to the frontend root.
- `eslint.config.mjs` — flat ESLint config using `eslint-config-next/core-web-vitals` and `/typescript`, plus generated output ignores. Compare its imports with installed/configured package versions before modifying lint setup.
- `AGENTS.md` — local Next.js instructions and the requirement to read and maintain these project notes; read relevant docs under `node_modules/next/dist/docs/` before changing Next.js APIs or conventions. The installed Next.js version may differ from prior knowledge.
- `.gitignore` — ignores framework/build output, dependencies, local env files, and editor/OS artifacts; permits env templates.

## Commands

- `npm run dev` — development server.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint.

## Current implementation state

- The app is still the Create Next App landing page with starter SVGs in `public/` and a generated starter favicon.
- Root metadata still says “Create Next App”; no product-specific functionality or data integrations have been identified yet.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source. Source scan excluded these generated/dependency directories.

## Maintenance rule

Keep these notes concise and factual. When a task reveals or changes architecture, routes, data flow, integrations, scripts, or important conventions, update the relevant section here so later work can start from this map instead of re-reading the entire project.
