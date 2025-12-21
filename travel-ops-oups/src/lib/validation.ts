import { z } from "zod";

export const flightSegmentSchema = z.object({
  airline: z.string().default(""),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  duration: z.string().optional(),
  details: z.string().optional(),
});

export const packageSchema = z.object({
  status: z.enum(["draft", "published"]).default("draft"),
  general: z.object({
    productName: z.string().min(1, "Product name is required"),
    productCode: z.string().min(1, "Product code is required"),
    responsible: z.string().min(1, "Responsible is required"),
    creationDate: z.string().min(1, "Creation date is required"),
    imageUrl: z.string().optional(),
    stock: z.number().int().min(0),
  }),
  flights: z.object({
    destination: z.string().min(1, "Destination is required"),
    cities: z.array(z.string()).default([]),
    flights: z.array(flightSegmentSchema).min(1, "At least one flight is required"),
    visaStatus: z.string().optional(),
    transferStatus: z.string().optional(),
  }),
  accommodations: z.array(
    z.object({
      name: z.string().min(1, "Accommodation name is required"),
      category: z.string().optional(),
      pension: z.string().optional(),
      mapLink: z.string().optional(),
    })
  ),
  pricing: z.array(
    z.object({
      label: z.string().min(1),
      subLabel: z.string().optional(),
      unitPrice: z.number().int().min(0),
      commission: z.number().int().optional(),
    })
  ),
  agencyCommissions: z.object({
    adulte: z.object({ t1: z.number().int(), t2: z.number().int(), t3: z.number().int() }),
    enfant: z.number().int(),
    bebe: z.number().int(),
  }),
  content: z.object({
    included: z.array(z.string()).default([]),
    excluded: z.array(z.string()).default([]),
    excursionsIncluded: z.array(z.string()).default([]),
    excursionsExtra: z.array(z.string()).default([]),
  }),
  itinerary: z.object({
    active: z.boolean(),
    days: z.array(
      z.object({
        dayNumber: z.number().int(),
        description: z.string(),
      })
    ),
    partnerName: z.string().optional(),
    emergencyContact: z.string().optional(),
    internalNotes: z.string().optional(),
    clientInformation: z.string().optional(),
  }),
  metadata: z
    .object({
      destinationId: z.string().optional(),
      segmentFit: z.string().optional(),
      seasonality: z.string().optional(),
    })
    .optional(),
});

export const packageUpdateSchema = packageSchema.partial().extend({
  general: packageSchema.shape.general.partial().optional(),
  flights: packageSchema.shape.flights.partial().extend({
    flights: packageSchema.shape.flights.shape.flights.optional(),
  }).optional(),
  accommodations: packageSchema.shape.accommodations.optional(),
  pricing: packageSchema.shape.pricing.optional(),
  agencyCommissions: packageSchema.shape.agencyCommissions.partial().optional(),
  content: packageSchema.shape.content.partial().optional(),
  itinerary: packageSchema.shape.itinerary.partial().optional(),
  metadata: packageSchema.shape.metadata?.optional(),
});

export const bookingSchema = z.object({
  packageId: z.string().min(1),
  departureId: z.string().optional(),
  bookingType: z.union([z.literal("En option"), z.literal("Confirmée"), z.literal("Confirmee")]),
  reservedUntil: z.string().optional(),
  rooms: z.array(
    z.object({
      roomType: z.string().min(1),
      occupants: z.array(
        z.object({
          type: z.enum(["ADL", "CHD", "INF"]),
          name: z.string().optional(),
        })
      ),
    })
  ),
  paxTotal: z.number().int().min(1),
  uploads: z.object({
    passportScans: z.array(z.string()).default([]),
    requiredDocuments: z.array(z.string()).default([]),
    paymentProofUrl: z.string().optional(),
  }),
  payment: z.object({
    paymentMethod: z.string().min(1),
    totalPrice: z.number().int().min(0),
    paidAmount: z.number().int().min(0),
    isFullyPaid: z.boolean(),
  }),
});

export const departureSchema = z.object({
  packageId: z.string().min(1),
  flightLabel: z.string().min(1),
  airline: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  status: z.enum(["pending_validation", "validated"]).default("pending_validation"),
});

export const taskTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  productType: z.string().optional(),
  offsetDays: z.number().int(),
  defaultRole: z.enum(["administrator", "travel_designer", "sales_agent", "viewer"]).optional(),
});

export const taskInstanceSchema = z.object({
  departureId: z.string().min(1),
  title: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["pending", "in_progress", "done", "blocked"]).default("pending"),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
});
