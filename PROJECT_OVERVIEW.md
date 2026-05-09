# Intercollab project overview

Workspace: `d:\intercollab\collab-node`

## Summary

This repository is a Node.js monorepo using **npm workspaces** with two apps:

- **`client/`**: React + Vite + Tailwind (frontend SPA)
- **`server/`**: Express + Socket.IO + Prisma + TypeScript (backend API + realtime)

Root scripts orchestrate running/building both via `concurrently`.

## Tech stack (from package manifests)

### Root (`package.json`)
- Workspaces: `["server", "client"]`
- Dev tool: `concurrently`

### Client (`client/package.json`)
- Runtime deps:
  - `react`, `react-dom`
  - `react-router-dom`
  - `axios`
  - `socket.io-client`
  - `clsx`, `tailwind-merge`
  - `@fortawesome/fontawesome-free`
- Tooling:
  - `vite`, `@vitejs/plugin-react`
  - `typescript`
  - `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/forms`

### Server (`server/package.json`)
- Runtime deps:
  - `express`
  - `socket.io`
  - `@prisma/client`
  - Auth/security: `jsonwebtoken`, `bcryptjs`
  - Uploads: `multer`
  - Email: `nodemailer`
  - Config/CORS: `dotenv`, `cors`
- Tooling:
  - `prisma`
  - `tsx` (dev/watch)
  - `typescript`
  - `kill-port`
  - `@types/*` (TypeScript typings)

## Project structure (key folders/files)

### Root (`d:\intercollab\collab-node`)
- `package.json` — workspaces and top-level scripts
- `package-lock.json` — npm lockfile exists
- `node_modules/` — installed deps; largest disk consumer

### Client (`client/`)
Key files:
- `client/index.html`
- `client/src/main.tsx` — app bootstrap
- `client/src/App.tsx` — main app component / routing shell
- `client/src/pages/**` — feature pages (auth/admin/chat/projects/feed/notifications/research/events/etc.)
- `client/src/components/**` — UI components (layout header/sidebar/rightbar/etc.)
- `client/src/layouts/**` — app/guest layouts
- `client/src/hooks/**` — hooks such as auth/socket
- `client/src/lib/**` — API/socket/util helpers
- `client/src/styles/app.css` — styling entry

Tooling/config:
- `client/vite.config.ts`
- `client/tailwind.config.ts`
- `client/postcss.config.js`
- `client/tsconfig.json`

### Server (`server/`)
Key files:
- `server/src/index.ts` — server entry
- `server/src/routes/**` — API routes (auth/projects/chat/ai/research/events/admin/etc.)
- `server/src/services/**` — domain services (email/verification/ai/search/feed/trust/notifications/etc.)
- `server/src/socket/index.ts` — Socket.IO setup
- `server/src/middleware/auth.ts` — auth middleware
- DB/Prisma:
  - `server/src/prismaClient.ts`
  - `server/src/config/database.ts`
  - `server/src/generated/prisma/**` — generated Prisma runtime/client artifacts (adds disk usage)
- `server/.env` — exists (contains secrets; do NOT commit)

## Commands / scripts

### Root (`package.json`)
- `npm run dev` — runs `server` + `client` concurrently
- `npm run build` — builds client then server
- `npm run start` — starts server (prod)
- DB helpers (delegated to server workspace): `db:generate`, `db:clean-prisma`, `db:regenerate`, `db:push`

### Client (`client/package.json`)
- `npm run dev` — starts Vite dev server
- `npm run build` — creates production build
- `npm run preview` — previews built site
- `npm run typecheck` — `tsc -b --noEmit`

### Server (`server/package.json`)
- `npm run dev` — `kill-port 3001 && tsx watch src/index.ts`
- `npm run build` — runs Prisma generate script then `tsc` (build script appears to ignore TS warnings)
- `npm run start` — `node dist/index.js`
- Prisma/DB scripts: `db:pull`, `db:push`, `db:seed`, plus data backfill scripts

## Ports

- **Backend dev port**: **3001** (explicitly cleared before starting)
- **Frontend dev port**: Vite default **5173** unless overridden in `client/vite.config.ts`

## Storage (measured on this machine)

### Total repository size (current state)
- **Total**: **671.7 MB** (0.656 GB)
- **Bytes**: 704,328,183

### Biggest top-level directories

- **`node_modules/`**: **424.7 MB** (0.415 GB)
- **`server/`**: **46.4 MB** (0.045 GB)
- **`uploads/`**: **6.8 MB** (0.007 GB)
- **`client/`**: **6.0 MB** (0.006 GB)

### Largest files (top 15 by size)

Most of the large files are Prisma engines/binaries and a zip artifact.

1. `collab-node.zip` — 187.3 MB
2. `node_modules/prisma/query_engine-windows.dll.node` — 20.2 MB
3. `node_modules/@prisma/engines/**/libquery-engine` — 20.2 MB (cached)
4. `node_modules/.cache/prisma/**/libquery-engine` — 20.2 MB (cached)
5. `server/src/generated/prisma/query_engine-windows.dll.node` — 20.2 MB
6. `server/node_modules/.cache/prisma/**/libquery-engine` — 20.2 MB (cached)
7. `node_modules/@prisma/engines/query_engine-windows.dll.node` — 20.2 MB
8. `node_modules/@prisma/engines/schema-engine-windows.exe` — 18.1 MB
9. `node_modules/.cache/prisma/**/schema-engine` — 18.1 MB (cached)
10. `node_modules/@prisma/engines/**/schema-engine` — 18.1 MB (cached)
11. `node_modules/@esbuild/win32-x64/esbuild.exe` — 10.9 MB
12. `node_modules/vite/node_modules/@esbuild/win32-x64/esbuild.exe` — 10.1 MB
13. `node_modules/typescript/lib/typescript.js` — 8.7 MB
14. `node_modules/typescript/lib/_tsc.js` — 5.9 MB
15. `node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json` — 5.1 MB

## RAM / CPU expectations

These are practical estimates for this stack (Vite + React + TS + Express + Prisma + Socket.IO).

### Development (running `npm run dev` at root)
- **Recommended RAM**
  - **8 GB minimum**
  - **16 GB comfortable**
- **CPU**
  - Modern **4 cores** is fine for dev
  - Builds/typecheck benefit from more cores
- **Why**
  - Vite dev server + React tooling commonly uses ~0.5–1.5 GB RAM
  - Server watcher (`tsx watch`) + TS + Prisma commonly uses ~0.3–1.0 GB RAM
  - Browser tabs + IDE typically dominate additional usage

### Production (server only)
- **Server RAM**
  - Small/medium loads: **256 MB–1 GB**
  - Increase if you have many concurrent Socket.IO connections, heavy file uploads, or large in-memory caching
- **CPU**
  - Small/medium: **1–2 vCPU** often sufficient
  - Scale with concurrent realtime + API traffic
- **Database**
  - DB sizing is separate and often needs more RAM than the Node server as data grows.

## Operational/security notes

- `server/.env` contains secrets (JWT secret, DB URL, email credentials, etc.). Keep it out of git and secure it in deployment.
- `node_modules/` should not be committed; it inflates disk usage significantly.
- Prisma engines/binaries are a major source of disk usage on Windows (as shown above).

## Feature map (by folders)

- **Client**: auth, admin, chat, projects (including kanban), feed, notifications, research, events, profile, explore.
- **Server**: matching route groups under `server/src/routes/**` and supporting logic under `server/src/services/**`, plus realtime under `server/src/socket/**`.

