export type UserRole = "administrator" | "travel_designer" | "sales_agent" | "viewer";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
}

export type PackageStatus = "draft" | "published";

export interface PackageGeneralInfo {
  productName: string;
  productCode: string;
  responsible: string;
  creationDate: string;
  imageUrl?: string;
  stock: number;
}

export interface FlightSegment {
  airline: string;
  departureDate: string;
  returnDate: string;
  duration?: string;
  details?: string;
}

export interface PackageFlights {
  destination: string;
  cities: string[];
  flights: FlightSegment[];
  visaStatus?: string;
  transferStatus?: string;
}

export interface Accommodation {
  name: string;
  category?: string;
  pension?: string;
  mapLink?: string;
}

export interface PricingItem {
  label: string;
  subLabel?: string;
  unitPrice: number;
  commission?: number;
}

export interface AgencyCommissions {
  adulte: {
    t1: number;
    t2: number;
    t3: number;
  };
  enfant: number;
  bebe: number;
}

export interface ContentSection {
  included: string[];
  excluded: string[];
  excursionsIncluded: string[];
  excursionsExtra: string[];
}

export interface ItineraryDay {
  dayNumber: number;
  description: string;
}

export interface Itinerary {
  active: boolean;
  days: ItineraryDay[];
  partnerName?: string;
  emergencyContact?: string;
  internalNotes?: string;
  clientInformation?: string;
}

export type OpsStatus = "pending_validation" | "validated";

export interface OpsPaymentStep {
  label: string;
  amount: number;
  dueDate?: string;
  paid?: boolean;
}

export interface Supplier {
  name: string;
  contact?: string;
  cost?: number;
  deadline?: string;
}

export interface OpsTimelineItem {
  title: string;
  date?: string;
  note?: string;
  kind?: "info" | "deadline" | "risk" | "done";
}

export interface OpsGroup {
  id: string;
  flightLabel: string;
  airline?: string;
  departureDate?: string;
  returnDate?: string;
  status: OpsStatus;
  validationDate?: string;
  suppliers: Supplier[];
  costs: OpsPaymentStep[];
  timeline: OpsTimelineItem[];
}

export interface OpsProject {
  id: string;
  packageId: string;
  groups: OpsGroup[];
}

export interface TravelPackage {
  id: string;
  status: PackageStatus;
  general: PackageGeneralInfo;
  flights: PackageFlights;
  accommodations: Accommodation[];
  pricing: PricingItem[];
  agencyCommissions: AgencyCommissions;
  content: ContentSection;
  itinerary: Itinerary;
  opsProject?: OpsProject;
}

export type BookingType = "En option" | "Confirmée";

export interface RoomOccupant {
  type: "ADL" | "CHD" | "INF";
  name?: string;
}

export interface BookingRoom {
  roomType: string;
  occupants: RoomOccupant[];
}

export interface BookingUploads {
  passportScans: string[];
  requiredDocuments: string[];
  paymentProofUrl?: string;
}

export interface BookingPayment {
  paymentMethod: string;
  totalPrice: number;
  paidAmount: number;
  isFullyPaid: boolean;
}

export interface Booking {
  id: string;
  packageId: string;
  bookingType: BookingType;
  reservedUntil?: string;
  rooms: BookingRoom[];
  paxTotal: number;
  uploads: BookingUploads;
  payment: BookingPayment;
  createdAt: string;
}
