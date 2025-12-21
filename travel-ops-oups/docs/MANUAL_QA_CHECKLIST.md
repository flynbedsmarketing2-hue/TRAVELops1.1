# Manual QA Checklist

## Auth + RBAC
- [ ] Login as admin/designer/sales/viewer (seeded accounts).
- [ ] Viewer can access read-only pages but cannot create/update/delete.
- [ ] Sales can create bookings but cannot edit factory items.
- [ ] Designer can edit packages and factory items but cannot approve.
- [ ] Admin can do all actions.

## Packages
- [ ] Create package, verify ops groups auto-created from flights.
- [ ] Edit package flights and confirm ops group regeneration.
- [ ] Publish/draft toggle persists.
- [ ] Duplicate and import/export JSON works from DB.
- [ ] PDF export uses DB-backed data.

## Bookings
- [ ] Create booking via Sales wizard; totals update.
- [ ] Edit booking and confirm list updates.
- [ ] Delete booking and confirm removed.

## Ops
- [ ] Validate and reopen ops group with server-side status update.
- [ ] Add supplier, cost line, and timeline item; verify persistence.
- [ ] Cost summary shows totals, margin, break-even pax.

## Factory
- [ ] Create factory item in Idea stage.
- [ ] Fill brief fields and submit for validation.
- [ ] Approve/reject as admin and verify status history.

## Intelligence
- [ ] Create destination, visa rule, and event.
- [ ] Link destination to package via editor.

## Suppliers
- [ ] Create supplier with contact and verify list.

## Publishing
- [ ] Generate content pack JSON and copy snippets.

## Tasks
- [ ] Create task template and generate task instances.
- [ ] Update task status and assignee.

## Audit Logs
- [ ] Verify audit logs are written for create/update/delete actions.
