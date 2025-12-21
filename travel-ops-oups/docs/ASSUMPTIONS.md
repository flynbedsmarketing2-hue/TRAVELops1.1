# Assumptions

- Packages store complex fields (flights, pricing, content, itinerary) as JSON in Postgres for faster migration.
- Ops costs are modeled as CostLine records per departure; cost totals are used for margin estimates.
- Destination linking is stored in package.metadata.destinationId for now (no strict FK).
- Approval workflow is centered on FactoryItems; other entities can be added later.
- Viewer role can read shared lists (users list for assignment, factory board, intelligence data).
- Task templates are generic and not yet tied to a strict product type taxonomy.
- File uploads are staged for local disk storage via StorageService but not yet wired into UI forms.
