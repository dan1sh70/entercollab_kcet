# EnterCollab

EnterCollab is a full‑stack collaboration app with a **React + Vite** client and an **Express + Prisma** server (with **Socket.IO** realtime).

## Repo structure

- `client/` — React SPA (Vite + Tailwind)
- `server/` — Express API + Socket.IO + Prisma (TypeScript)
- `uploads/` — runtime uploads (ignored by git)

## Prerequisites

- Node.js (recommended: latest LTS)
- npm (workspaces are used)

## Quick start (local dev)

1. Install deps (from repo root)

```bash
npm install
```

2. Create env file (repo root)

```bash
copy .env.example .env
```

3. Generate Prisma client and push DB schema (SQLite by default)

```bash
npm run db:generate
npm run db:push
```

4. Start dev servers (client + server)

```bash
npm run dev
```

## Environment variables

`.env.example` contains the defaults:

- `DATABASE_URL`: default is SQLite `file:../database.sqlite`
- `JWT_SECRET`: set this to a random string in production
- `PORT`: server port (default `3001`)
- `OPENAI_API_KEY`: used by server AI routes (optional depending on usage)
- `OPENAI_MODEL`: default is `gpt-4o` (set to the model you deployed/are using)
- `NODE_ENV`: `development` / `production`

## Common scripts

From repo root:

- `npm run dev` — runs **server + client** concurrently
- `npm run build` — builds **client then server**
- `npm run start` — starts server (`server/dist/index.js`)

Database helpers:

- `npm run db:generate`
- `npm run db:push`
- `npm run db:regenerate`
- `npm run db:clean-prisma`

## Ports

- **Server**: `http://localhost:3001`
- **Client**: Vite default `http://localhost:5173`

## Notes

- Do not commit real secrets. This repo ignores `.env`, `node_modules/`, `dist/`, `*.sqlite`, `uploads/`, and `*.zip`.

