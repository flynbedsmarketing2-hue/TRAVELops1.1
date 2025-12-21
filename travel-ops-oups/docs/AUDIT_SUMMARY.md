# Audit Summary

Date: 2025-12-21

## LocalStorage + Zustand usage
- src/stores/useUserStore.ts: Zustand persist store backed by localStorage (travelops-user-store) with mock users, login/logout, CRUD, reset password.
- src/stores/usePackageStore.ts: Zustand persist store backed by localStorage (travelops-packages-store) with mock packages + ops project generation, package CRUD, import/export JSON, publish/draft, duplicate.
- src/stores/useBookingStore.ts: Zustand persist store backed by localStorage (travelops-bookings-store) with mock bookings CRUD.
- src/stores/useUiStore.ts: Zustand persist store backed by localStorage for theme.
- src/stores/storeUtils.ts: createJSONStorage with window.localStorage; noop storage for SSR.
- src/app/ops/[packageId]/[groupId]/page.tsx: manual localStorage for tab persistence.

## Mocked auth usage
- src/stores/useUserStore.ts: mock users with plaintext passwords and default admin; login checks username/password in local state.
- src/lib/mockData.ts: mock user list and seeded packages/bookings (also includes ops groups).
- src/app/login/page.tsx: uses useUserStore().login and ensureAdmin.
- src/components/AuthGuard.tsx: client-only guard checking hydrated Zustand store; redirects to /login; role gating client-side.
- src/components/Header.tsx, src/components/Topbar.tsx, src/components/Sidebar.tsx: role-based navigation client-side only.

## Implied data models from UI/types
- User + roles (administrator, travel_designer, sales_agent, viewer) in src/types.ts.
- TravelPackage with:
  - general: productName/productCode/responsible/creationDate/imageUrl/stock
  - flights: destination/cities/flights(airline/departureDate/returnDate/duration/details)/visaStatus/transferStatus
  - accommodations, pricing, agencyCommissions, content sections, itinerary
  - status: draft/published
  - opsProject with groups (status pending_validation/validated, suppliers, costs, timeline)
- Booking with packageId, bookingType, rooms/occupants, uploads, payment, reservedUntil, createdAt.
- Ops group details: suppliers with deadlines, cost steps, timeline items.

## Routes/components tied to local state
- Pages using packages store: src/app/dashboard/page.tsx, src/app/packages/page.tsx, src/app/packages/[id]/page.tsx, src/app/packages/new/page.tsx, src/app/ops/page.tsx, src/app/ops/[packageId]/[groupId]/page.tsx, src/app/voyages/page.tsx, src/app/sales/page.tsx.
- Pages using booking store: src/app/dashboard/page.tsx, src/app/sales/page.tsx.
- Pages using user store: src/app/login/page.tsx, src/app/users/page.tsx, src/components/AppShell.tsx, src/components/AuthGuard.tsx, src/components/Header.tsx, src/components/Topbar.tsx.
- Components tied to packages/bookings: src/components/PackageEditor.tsx, src/components/PackagePdfButtons.tsx, src/components/BookingWizardModal.tsx.

## Notes
- Current persistence is client-only; no server-side RBAC or API protection.
- PDF exports in src/components/PackagePdfButtons.tsx and src/app/sales/page.tsx read from client state.
- Ops validation status toggles are client-side only (no audit trail).
