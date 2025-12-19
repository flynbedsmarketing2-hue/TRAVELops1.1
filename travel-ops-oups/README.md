# Travel Ops

Modern Next.js back-office for TravelOps built with the App Router, Tailwind CSS, and TypeScript.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the example environment file and adjust values as needed:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` – start the development server
- `npm run lint` – run ESLint with the project config (Next.js + TypeScript + Prettier)
- `npm run format` – format the codebase with Prettier
- `npm run typecheck` – run TypeScript type checking (`tsc --noEmit`)
- `npm run build` – create a production build
- `npm start` – serve the production build

## Development standards

- Prettier is configured in `prettier.config.mjs` to keep formatting consistent across the repo.
- ESLint uses the Next.js core web vitals and TypeScript presets, plus Prettier compatibility via `eslint-config-prettier`.
- Temporary dev logs (`dev-err.log`, `dev-out.log`) and local env files are ignored by git; use `.env.example` as a starting point.

## Continuous integration

A GitHub Actions workflow runs dependency installation, linting, type-checking, and builds on every pull request so changes stay production-ready.
