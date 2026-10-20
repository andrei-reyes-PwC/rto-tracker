# Repository guidance

- Before working in a subproject, read its `AGENTS.md` and `PROJECT_NOTES.md`, then inspect the files relevant to the task.
- Keep each subproject's `PROJECT_NOTES.md` current when its structure, dependencies, routes, data flow, or conventions change.
- Keep this repository's `PROJECT_NOTES.md` current when the top-level project layout or integration between apps changes.
- Keep documentation concise and factual. Follow the local framework's current conventions and documentation when changing framework code.

## Recurring cleanup and refactor workflow

- For a whole-system cleanup request, first inspect repository and subproject guidance, project notes, tracked source/configuration, and current working-tree changes.
- Review the frontend and backend across maintainability, duplication, boundaries, error handling, security-sensitive flows, and missing or weak coverage; exclude generated dependencies and build output.
- Present a prioritized, evidence-based plan with scope, rationale, risks, and suggested verification before changing implementation code.
- Wait for the user's acceptance of that plan before executing it. If the user requests revisions, update the plan and wait for acceptance.
- After acceptance, implement the agreed scope, keep each affected `PROJECT_NOTES.md` current, and report changed files, verification performed, and follow-up items for review.
- Treat this sequence as the default for future whole-system cleanup requests; do not make the user restate it.
