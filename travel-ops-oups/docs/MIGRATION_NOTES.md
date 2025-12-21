# Migration Notes

## Overview
- Replaced client-only Zustand/localStorage persistence with Prisma + Postgres.
- Introduced NextAuth credentials login with secure password hashing and DB sessions.
- Added server-side RBAC enforcement and audit logging for CRUD actions.

## Data Model Changes
- Packages, departures, bookings, tasks, suppliers, destinations, approvals are now stored in Postgres.
- Ops groups are persisted as Departure records (with supplier links, cost lines, timeline items).
- Package metadata now supports a linked destination via metadata.destinationId.

## App Flow Changes
- Packages, bookings, users, ops views load data from `/api/*` endpoints (SWR).
- Ops validation actions call server APIs and write audit logs.
- Users are managed via server APIs (no plaintext passwords stored client-side).

## Notes for Deploy
- Set `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` in `.env.local`.
- Run `prisma migrate dev` and `prisma generate` before running the app.
- Seed data via `npm run seed`.
