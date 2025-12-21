# Product Factory Implementation Plan

## Phase 0: Foundation
- Add Prisma + Postgres schema, migrations, and seed data.
- Implement NextAuth credentials auth with secure password hashing and session storage.
- Enforce server-side RBAC in API route handlers (admin, designer, sales, viewer).
- Create CRUD APIs for packages, departures, bookings, tasks, users.
- Replace Zustand/localStorage data flows with API-backed SWR fetching.
- Add audit log helper and log create/update/delete for core entities.

## Phase 1: Product Factory MVP
- Factory pipeline module with stages: Idea, Research, Brief, Build, Validation, Published.
- Brief template enforcement + readiness checks (block move to validation/publish when missing).
- Destination Intelligence module (destinations, visa rules, events) + link to package metadata.
- Approval workflow (submit for validation, approve/reject with comments, history preserved).
- Supplier CRM module (suppliers, contacts, terms, SLA notes) + links to departures/cost lines.
- Costing/margin basics (cost lines, totals, margin, break-even pax summary).
- Publishing Center MVP (content pack JSON, WhatsApp share text, email snippet).
- Ops tasks/J-x support (task templates, task instances, generator, filters, assignments).

## Phase 2: Scaffold Only
- Publishing channel placeholders (Flynbeds, Nouba Plus) with stub UI.
- Analytics dashboard skeleton (empty charts, wired queries).
- Supplier contracting attachments and versioning placeholders.

## Risk Notes
- Large schema introduces migration complexity; validate with small datasets before production.
- Session/role propagation relies on NextAuth + Prisma adapter; ensure role lookups are cached where needed.
- Moving from local state to API data can surface ordering and latency issues; add loaders and toasts.
- JSON-based package payloads trade strict relational constraints for speed; revisit normalization later.
