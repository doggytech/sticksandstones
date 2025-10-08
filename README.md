This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# Sticks and Stones — Golf Score Tracker

Sticks and Stones is a lightweight Next.js + React app for tracking golf scores locally or in a simple multiplayer mode powered by InstantDB. It supports 9- and 18-hole rounds, up to 6 players, live score syncing in multiplayer, and an easy-to-use score entry and summary UI.

This README explains how to run the project, developer workflows, important files, architecture decisions (including the idempotent score writes), and common troubleshooting steps.

---

## Highlights

- Local play: Create a round and track scores locally (uses localStorage auto-save).
- Multiplayer: Create/join a lobby with a 6-character room code. Players sync scores to InstantDB and see real-time updates.
- 9- and 18-hole support — UI auto-selects the 9-hole view when the course has 9 holes.
- Deterministic idempotent score writes — avoids duplicate score entities in the DB by deriving a deterministic id from `gameId_playerId_holeNumber`.

## Quick start

Requirements

- Node.js (v18+ recommended)
- npm (or pnpm/yarn)

Install

```bash
npm install
```

Run the dev server

```powershell
npm run dev
```

Open the app

- http://localhost:3000 (or the port shown by Next when dev server starts)

Notes

- If you change environment variables (or .env.local), restart the dev server.

## Available scripts

- `npm run dev` — start Next.js in development (Turbopack)
- `npm run build` — build for production
- `npm run start` — start the production server after build
- `npm run lint` — run ESLint

## Important files and folders

- `src/app/`
	- `page.tsx` — main entry. Manages the top-level flow (welcome, setup, lobby, playing). Hosts `ScoreCard`.
	- `layout.tsx` — site layout and metadata (references `/manifest.json`).
- `src/components/scorecard/` — UI pieces for the scorecard and setup (ScoreCard, RoundSummary, SetupWizard, WaitingRoom, etc.).
- `src/context/` — React contexts
	- `GameContext.tsx` — reducer-based game state (round, current hole, view/display modes, convenience methods)
	- `PlayerAuthContext.tsx` — session (player id/name/host)
- `src/lib/` — core logic
	- `db.ts` — InstantDB client init and helpers (schema, `uuidFromString`, `generateRoomCode`)
	- `multiplayer.ts` — create/join game, score upsert, real-time hooks (`useGameData`, `useFindGameByRoomCode`), `convertDBToRound`
	- `utils.ts` — scoring helpers and small utilities

## Architecture notes

State management

- `GameContext` holds the current Round (players, holes, scores) and navigation-related flags. Use the exposed helper methods (`startNewRound`, `resetGame`, `updateScore`, etc.) instead of manipulating state directly.

Multiplayer & InstantDB

- The app uses `@instantdb/react` to read/write realtime state to InstantDB.
- Instead of querying to find existing score records, the app generates a deterministic UUID for each score using the composite key `gameId_playerId_holeNumber` via `uuidFromString`. This allows safe upserts: writing the entity at that deterministic id will create or replace the score record.
- `convertDBToRound` deduplicates score records server-side by compositeKey and selects the latest `updatedAt` when multiple entries exist.

Security & config

- `src/lib/db.ts` currently contains a dev `APP_ID`. For production move this to `.env.local` and read it via `process.env.INSTANT_DB_APP_ID` or `NEXT_PUBLIC_INSTANT_APP_ID` as appropriate.

## Troubleshooting

- Black/blank page after clicking "Start New Round":
	- The top-level `page.tsx` manages the `flow` variable that decides which screen to show. `Start New Round` must call the parent `handleNewRound` so the parent clears session/temp data and sets `flow = 'welcome'`. The repo was updated to pass `onNewRound` into `ScoreCard` to ensure the parent flow resets correctly. If you still see a blank screen, check the browser console for exceptions and the terminal for server warnings.

- `GET /manifest.json 404`:
	- `layout.tsx` references `/manifest.json`. Ensure `public/manifest.json` exists (a minimal file is included in this repo). This is commonly what causes a `GET /manifest.json 404` message in dev logs.

- LightningCSS native module errors during install (Windows):
	- If you see an error like "Cannot find module '../lightningcss.win32-x64-msvc.node'", try reinstalling dependencies and rebuilding native modules. On Windows you may need the build tools (vs-build tools, windows-build-tools, or equivalent) for native modules.

- InstantDB runtime 404 when proxying queries:
	- If you added a server-side proxy for the InstantDB runtime it needs to match the provider's exact route shapes and auth. The app uses deterministic upserts to avoid needing a query proxy in most cases.

## Development recommendations / TODOs

- Move InstantDB configuration into environment variables and remove hard-coded `APP_ID` from `src/lib/db.ts`.
- Add unit tests for `src/lib/utils.ts` (scoring calculations) and `GameContext` reducer logic.
- Add e2e tests (Cypress/Playwright) for multiplayer flows (create game, join, play, finish, start new round).
- Improve handling of offline/reconnect for multiplayer: add retries and connection status UI.

## Help / next steps I can do for you

If you'd like, I can:

- Extract InstantDB app id into `.env.local` and update `db.ts` to use it.
- Add unit tests for the scoring utilities and reducer and wire them into CI.
- Add a short CONTRIBUTING.md with local dev and troubleshooting tips.

Tell me which you'd like and I will implement it.

---

Thank you — happy testing and let me know what feature or fix you'd like next.
