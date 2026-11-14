# Copilot instructions for jazz-render

## Project shape

This repository is a Vite + React + TypeScript single-page app. The main entry point is `src/main.tsx`, which mounts the app into the `#root` element in `index.html`. The app shell lives in `src/App.tsx`, while global styling lives in `src/index.css` and component-level styling in `src/App.css`.

The project currently has no backend, routing layer, API client, or state-management library. The app is intentionally thin: most work is expected to stay inside `src/` and rely on the existing Vite build pipeline rather than introducing broad framework changes.

## Build, lint, and validation

Use the scripts in `package.json`:

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and produce a production build
- `npm run lint` — run ESLint across the project
- `npm run preview` — preview the built app locally

There is no `test` script configured in this repo at the moment. Validation is currently done via `npm run build` and `npm run lint`; if a test runner is added later, prefer the project’s existing test command and scope it to a single file when possible.

## Architecture notes

- `vite.config.ts` is the source of project-level build configuration. It enables the React plugin and the React Compiler Babel preset.
- `src/assets/` contains imported static assets such as images; prefer keeping new images/assets here instead of hardcoded asset paths.
- `public/` is for static files that should be served directly by Vite without a build step.
- `tsconfig*.json` configures TypeScript for app code and the Vite/node environment; keep TS types consistent with the existing setup when adding files.
- The app is a client-only UI. Any new behavior should usually live in React components and local state unless there is a clear reason to introduce additional architecture.

## Code conventions specific to this repo

- Keep UI code in TypeScript/TSX, and keep style changes in the existing CSS files unless a new component clearly warrants a dedicated stylesheet.
- Favor the current Vite/React pattern: small component functions, JSX composition, and local state, rather than introducing new framework conventions or abstraction layers.
- When adding images or other static files, prefer `src/assets` or `public` and reference them via the existing import/asset pattern used by the app.
- Do not add new build tools, package ecosystems, or runtime frameworks unless the change requires them and the repo documentation calls for it.
- Preserve the existing template conventions: the project is intentionally lightweight and follows the standard Vite React starter structure.

## When working in this repo

- Prefer surgical edits inside the `src/` tree over broad refactors.
- If a change affects the app shell, check both `src/App.tsx` and the relevant CSS file together.
- Be aware that the README is the default Vite React template README; it does not describe a custom product architecture.
- If you need to add a feature, keep it aligned with the existing minimal single-page app structure rather than inventing a new app architecture.
