# Project Notes

This file is the short working map for future work in `next-frontend`. Read it first, then inspect only the files relevant to the current task. Update it when project structure, dependencies, conventions, or important behavior changes.

## What this project is

- A starter Next.js web frontend in the `next-frontend/` directory.
- Uses Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `5`, Tailwind CSS `4`, and ESLint `9`.
- npm is the package manager (`package-lock.json` is checked in).
- Next.js App Router: route and root layout live in `app/`.

## Key files

- `app/page.tsx` — current home page; still the Create Next App starter screen.
- `app/layout.tsx` — root HTML/layout, metadata, and Geist font setup.
- `app/globals.css` — imports Tailwind and defines base theme colors.
- `next.config.ts` — Next config; enables `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, and Tailwind's Turbopack CSS loader.
- `tsconfig.json` — strict TypeScript, bundler resolution, `@/*` maps to the frontend root.
- `eslint.config.mjs` — Next Core Web Vitals and TypeScript lint presets.
- `AGENTS.md` — local Next.js instructions and the requirement to read and maintain these project notes; read relevant docs under `node_modules/next/dist/docs/` before changing Next.js APIs or conventions. The installed Next.js version may differ from prior knowledge.
- `.gitignore` — ignores framework/build output, dependencies, local env files, and editor/OS artifacts; permits env templates.

## Commands

- `npm run dev` — development server.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint.

## Current implementation state

- The app is an unmodified Create Next App landing page with starter SVGs in `public/`.
- Root metadata still says “Create Next App”; no product-specific functionality or data integrations have been identified yet.
- `node_modules/` and `.next/` exist locally and are generated; do not treat them as source.

## Maintenance rule

Keep these notes concise and factual. When a task reveals or changes architecture, routes, data flow, integrations, scripts, or important conventions, update the relevant section here so later work can start from this map instead of re-reading the entire project.
