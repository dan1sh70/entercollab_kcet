# EnterCollab

EnterCollab is a full‑stack collaboration platform built for students, researchers, and academic teams to discover projects, connect with peers, and collaborate on research and technical work. It combines a modern React + Vite frontend with an Express + Prisma backend and realtime features powered by Socket.IO.

Table of contents
- [EnterCollab](#entercollab)
  - [Project Overview](#project-overview)
  - [Key Features](#key-features)
  - [Architecture](#architecture)
  - [Getting Started (Local Development)](#getting-started-local-development)
  - [Environment Variables](#environment-variables)
  - [Database \& Migrations](#database--migrations)
  - [Realtime / Socket.IO](#realtime--socketio)
  - [AI Assistant Integration](#ai-assistant-integration)
  - [Directory Structure](#directory-structure)
  - [Testing](#testing)
  - [Deployment](#deployment)
  - [Security \& Privacy Notes](#security--privacy-notes)
  - [Contributing](#contributing)
  - [License](#license)

## Project Overview

EnterCollab helps academic teams and students:
- Discover and browse projects and research opportunities.
- Create project posts, request collaborators, and manage project boards.
- Communicate via private/group chat rooms (project or direct) with realtime messaging.
- Use the built-in AI assistant for research help, summaries, and task extraction.
- Share events, follow institutions, and build a profile + reputation over time.

This repository contains both the client (`client/`) and server (`server/`) applications and some helper scripts.

## Key Features

- Projects directory with filters, tags, and bookmarking
- Project creation, project-specific chat rooms, and team management
- Direct messages (1:1) and notifications
- AI assistant integrated in chat (request summaries, ask for research help, extract tasks)
- Realtime updates via Socket.IO (messages, notifications, project refresh)
- Authentication and role types (student, institution)
- Prisma ORM with a simple SQLite development DB (supports other DBs in production)
- Tailwind-based design system and responsive layout

## Architecture

- Frontend: React + Vite + TypeScript, Tailwind CSS
- Backend: Express + TypeScript, Prisma ORM, Socket.IO
- Database: SQLite for local development (configurable via `DATABASE_URL`)
- AI: Integrated via `server/src/services/ai.ts` to call an LLM provider

## Getting Started (Local Development)

Prerequisites

- Node.js (LTS recommended)
- npm (or compatible package manager)
- (Optional) `git-lfs` if you plan to add large binary files

Local setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Copy environment variables and update values:

```bash
copy .env.example .env
# then edit .env to set secrets like JWT_SECRET and OPENAI_API_KEY
```

3. Generate Prisma client and apply schema (dev):

```bash
npm run db:generate
npm run db:push
```

4. Start both servers for development (concurrently):

```bash
npm run dev
```

5. Open the client (Vite) URL (usually `http://localhost:5173`) and the API server (`http://localhost:3001`).

Notes about the `.env` file
- Never commit `.env` or real secrets to git.
- Use `.env.example` as reference for required variables.

## Environment Variables

The common variables live in `.env.example` — important ones include:

- `DATABASE_URL` — e.g. `file:./dev.db` for SQLite or a Postgres connection string
- `PORT` — server port (default `3001`)
- `JWT_SECRET` — secret used for signing JWTs
- `OPENAI_API_KEY` — key used by the AI service (if enabled)
- `OPENAI_BASE_URL` / `OPENAI_MODEL` — optional, provider-specific config

## Database & Migrations

This project uses Prisma. For local development we use an SQLite database for simplicity.

- Generate client: `npm run db:generate`
- Push schema (dev): `npm run db:push`
- Migrations: keep migrations in `server/prisma/migrations` (already included for changes made)

If you want to export or share DB contents, create a sanitized SQL dump (do not include credentials or PII when committing dumps).

## Realtime / Socket.IO

- The server exposes Socket.IO events for `message:receive`, `chat:rooms:refresh`, `notification:new`, and others.
- Clients join private rooms named like `user:{id}` and chat rooms like `room:{roomId}`.
- The frontend utilities for socket connections are in `client/src/lib/socket.ts` and hooks in `client/src/hooks/useSocket.ts`.

## AI Assistant Integration

- The server includes AI helper functions at `server/src/services/ai.ts` and an API route `server/src/routes/ai.ts`.
- Chat supports an AI assistant room. The server can create a personal AI room and auto-generate responses using your configured LLM provider.
- Important: Ensure `OPENAI_API_KEY` (or provider key) is set and that you understand usage/billing from your provider.

## Directory Structure

- `client/` — React app
  - `src/` — application code
  - `public/` — static assets (place `logo.gif` here for header)
- `server/` — Express app
  - `src/` — API routes, services, socket logic
  - `prisma/` — schema and migrations
- `uploads/` — runtime file uploads (gitignored)

## Testing

- There are no automated tests included by default. Add tests as needed (Jest/React Testing Library / supertest).

## Deployment

- Build client and server, configure a production DB (Postgres or managed provider), and set environment variables safely.
- Use CI to run `npm ci`, `npm run build`, and `npm run start` in production.

## Security & Privacy Notes

- Do not check `.env` or DB files into git.
- Sanitize exported DB dumps before sharing publicly.
- Rate-limit AI usage and monitor costs when enabling the assistant.

## Contributing

- Fork the repo, create feature branches, and send pull requests.
- Keep changes scoped and include tests where appropriate.

## License

This project does not include an explicit license file. Add a `LICENSE` if you plan to open-source it.

---

