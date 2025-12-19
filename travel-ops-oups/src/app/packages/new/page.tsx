'use client';

import AuthGuard from "../../../components/AuthGuard";
import { PackageEditor } from "../../../components/PackageEditor";
import type { TravelPackage } from "../../../types";
import { DEFAULT_RESPONSIBLE_NAME, generateProductCode, todayISO } from "../../../lib/packageDefaults";

const defaultPackage: TravelPackage = {
  id: "new-package",
  status: "draft",
  general: {
    productName: "",
    productCode: generateProductCode(),
    responsible: DEFAULT_RESPONSIBLE_NAME,
    creationDate: todayISO(),
    imageUrl: "https://placehold.co/600x400?text=Package",
    stock: 20,
  },
  flights: {
    destination: "Paris",
    cities: ["Paris"],
    flights: [
      {
        airline: "Air Demo",
        departureDate: todayISO(),
        returnDate: todayISO(),
        duration: "7j/6n",
        details: "Vol direct aller/retour",
      },
    ],
    visaStatus: "neant",
    transferStatus: "inclus",
  },
  accommodations: [
    { name: "Hôtel Exemple", category: "4*", pension: "Demi-pension", mapLink: "https://maps.example.com" },
  ],
  pricing: [
    { label: "Adulte (Double)", subLabel: "Tarif public", unitPrice: 120000, commission: 8000 },
    { label: "Enfant", subLabel: "2-11 ans", unitPrice: 90000, commission: 6000 },
  ],
  agencyCommissions: {
    adulte: { t1: 5000, t2: 6000, t3: 7000 },
    enfant: 4000,
    bebe: 0,
  },
  content: {
    included: ["Vols A/R", "Transferts", "6 nuits d'hôtel"],
    excluded: ["Assurance", "Déjeuners"],
    excursionsIncluded: ["Tour de ville"],
    excursionsExtra: ["Croisière sur la Seine"],
  },
  itinerary: {
    active: true,
    days: [
      { dayNumber: 1, description: "Arrivée et installation" },
      { dayNumber: 2, description: "Visite guidée" },
    ],
    partnerName: "Agence Paris",
    emergencyContact: "+33 1 23 45 67 89",
    internalNotes: "Pré-rempli pour accélérer la saisie.",
    clientInformation: "Merci de confirmer les horaires.",
  },
};

export default function NewPackagePage() {
  return (
    <AuthGuard allowRoles={["administrator", "travel_designer"]}>
      <PackageEditor mode="create" initialPackage={defaultPackage} />
    </AuthGuard>
  );
}
