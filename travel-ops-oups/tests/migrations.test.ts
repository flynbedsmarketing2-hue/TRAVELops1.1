import { strict as assert } from "node:assert";
import { migratePersistedState, CURRENT_SCHEMA_VERSION } from "../src/stores/migrations";

const legacyState: any = {
  schemaVersion: 0,
  packages: [
    {
      id: "pkg-legacy",
      ops: {
        opsId: "ops-legacy",
        groups: [
          {
            id: "grp-1",
            opsStatus: "validate",
            validatedAt: "2024-01-01T00:00:00.000Z",
            departure_date: "2024-02-01",
          },
          {
            id: "grp-2",
            status: "pending",
            flightDate: "2024-03-10",
          },
        ],
      },
    },
  ],
  bookings: [
    {
      id: "bkg-legacy",
      packageId: "pkg-legacy",
      bookingType: "Confirmée",
      rooms: [],
      paxTotal: 0,
      uploads: { passportScans: [], requiredDocuments: [] },
      payment: { paymentMethod: "Virement", totalPrice: 0, paidAmount: 0, isFullyPaid: false },
      createdAt: "2024-01-01T00:00:00.000Z",
      groupId: "grp-1",
    },
  ],
};

const migrated = migratePersistedState(legacyState);

assert.equal(
  migrated.schemaVersion,
  CURRENT_SCHEMA_VERSION,
  "schemaVersion should be bumped to the latest version"
);

assert.ok(migrated.packages[0].opsProject, "opsProject should be present after migration");
assert.equal(
  migrated.packages[0].opsProject.id,
  "ops-legacy",
  "opsProject id should be preserved from legacy opsId"
);

const [firstGroup, secondGroup] = migrated.packages[0].opsProject.groups;
assert.equal(firstGroup.status, "validated", "ops status aliases should normalize to validated");
assert.equal(
  secondGroup.status,
  "pending_validation",
  "ops status aliases should normalize pending values"
);
assert.ok(firstGroup.validationDate, "validation date should be preserved from legacy fields");
assert.ok(firstGroup.departureDate, "departureDate should be preserved from legacy fields");

assert.equal(
  migrated.bookings[0].departureGroupId,
  "grp-1",
  "bookings should gain departureGroupId when missing"
);

console.log("Migration tests passed");
