import type { Booking, TravelPackage, User } from "../types";

export const mockUsers: User[] = [
  {
    id: "seed-designer",
    username: "designer",
    password: "password",
    role: "travel_designer",
    fullName: "Inès Redjem",
  },
  {
    id: "seed-sales",
    username: "sales",
    password: "password",
    role: "sales_agent",
    fullName: "Yasmine Bakkali",
  },
  {
    id: "seed-viewer",
    username: "viewer",
    password: "password",
    role: "viewer",
    fullName: "Observateur Ops",
  },
];

export const mockPackages: TravelPackage[] = [
  {
    id: "pkg-lisbonne-0625",
    status: "published",
    general: {
      productName: "City-break Lisbonne & Sintra",
      productCode: "LIS-0625",
      responsible: "Inès Redjem",
      creationDate: "2025-02-01T10:00:00.000Z",
      imageUrl:
        "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80",
      stock: 28,
    },
    flights: {
      destination: "Portugal",
      cities: ["Lisbonne", "Sintra"],
      flights: [
        {
          airline: "TAP",
          departureDate: "2025-06-02",
          returnDate: "2025-06-09",
          duration: "7j/6n",
          details: "Direct ALG-LIS 09:15",
        },
        {
          airline: "Air Algérie + TAP",
          departureDate: "2025-06-16",
          returnDate: "2025-06-23",
          duration: "7j/6n",
          details: "Via MAD, retour tardif",
        },
      ],
      visaStatus: "Visa non requis",
      transferStatus: "Transfers privatisés inclus",
    },
    accommodations: [
      { name: "Bairro Alto Hotel", category: "5*", pension: "Petit-déjeuner", mapLink: "https://maps.app.goo.gl/AGHd8mrnkEjMF4Tg7" },
      { name: "Tivoli Oriente", category: "4*", pension: "Demi-pension", mapLink: "https://maps.app.goo.gl/z7ZpRqUVrzpDy5oT9" },
    ],
    pricing: [
      { label: "Adulte", subLabel: "Base double", unitPrice: 185000, commission: 12000 },
      { label: "Enfant", subLabel: "2-11 ans", unitPrice: 135000, commission: 8000 },
      { label: "Bébé", subLabel: "-2 ans", unitPrice: 45000, commission: 2500 },
    ],
    agencyCommissions: {
      adulte: { t1: 8000, t2: 9000, t3: 11000 },
      enfant: 5000,
      bebe: 2500,
    },
    content: {
      included: ["Vols TAP directs", "6 nuits en centre-ville", "Petit-déjeuner quotidien", "Assurance assistance"],
      excluded: ["City tax", "Dépenses personnelles"],
      excursionsIncluded: ["Tour guidé à Sintra", "Tram 28 illimité"],
      excursionsExtra: ["Croisière sur le Tage", "Surclassement croisière sunset"],
    },
    itinerary: {
      active: true,
      days: [
        { dayNumber: 1, description: "Arrivée, transfert privé, installation au Bairro Alto." },
        { dayNumber: 2, description: "Visite guidée de Lisbonne et Belém avec guide francophone." },
        { dayNumber: 4, description: "Excursion Sintra & Cabo da Roca, déjeuner inclus." },
      ],
      partnerName: "Lisbon4U DMC",
      emergencyContact: "+351 987 654 321",
      internalNotes: "Prévoir voucher papier pour le tram. Stock ajusté en fonction du dépôt TAP.",
      clientInformation: "Climatisations récentes, quartiers centraux sécurisés.",
    },
    opsProject: {
      id: "ops-lisbonne",
      packageId: "pkg-lisbonne-0625",
      groups: [
        {
          id: "ops-lis-1",
          flightLabel: "TAP - départ 2025-06-02",
          departureDate: "2025-06-02",
          status: "validated",
          validationDate: "2025-04-15T10:00:00.000Z",
          suppliers: [
            { name: "Bairro Alto Hotel", contact: "ops@bairro.com", cost: 540000, deadline: "2025-05-10" },
            { name: "MTS Transferts", contact: "dispatch@mts.pt", cost: 90000, deadline: "2025-05-28" },
          ],
          costs: [
            { label: "Dépôt TAP", amount: 1200000, dueDate: "2025-04-05", paid: true },
            { label: "Solde hôtels", amount: 800000, dueDate: "2025-05-15", paid: false },
          ],
          timeline: [
            { title: "Groupe créé", date: "2025-03-01", note: "Vol 1", kind: "info" },
            { title: "Contrat DMC signé", date: "2025-03-10", kind: "done" },
            { title: "Dépôt TAP payé", date: "2025-04-05", kind: "done" },
          ],
        },
        {
          id: "ops-lis-2",
          flightLabel: "Air Algérie + TAP - départ 2025-06-16",
          departureDate: "2025-06-16",
          status: "pending_validation",
          suppliers: [
            { name: "Tivoli Oriente", contact: "groupes@tivoli.pt", cost: 410000, deadline: "2025-04-20" },
            { name: "Lisbon Vans", contact: "ops@lisvan.pt", cost: 75000, deadline: "2025-04-10" },
          ],
          costs: [
            { label: "Acompte aérien", amount: 960000, dueDate: "2024-12-18", paid: false },
            { label: "Transferts", amount: 75000, dueDate: "2025-04-10", paid: false },
          ],
          timeline: [
            { title: "Groupe créé", date: "2025-03-15", note: "Vol 2", kind: "info" },
            { title: "Rooming list reçue", date: "2025-03-28", kind: "info" },
          ],
        },
      ],
    },
  },
  {
    id: "pkg-sahara-1125",
    status: "published",
    general: {
      productName: "Raid Sahara & bivouac luxe",
      productCode: "DZS-1125",
      responsible: "Khaled Amara",
      creationDate: "2025-01-20T14:00:00.000Z",
      imageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
      stock: 18,
    },
    flights: {
      destination: "Algérie Sud",
      cities: ["Djanet", "Tadrart"],
      flights: [
        {
          airline: "Air Algérie",
          departureDate: "2025-11-08",
          returnDate: "2025-11-15",
          duration: "8j/7n",
          details: "ALG-DJT de nuit",
        },
      ],
      visaStatus: "Autorisation sud incluse",
      transferStatus: "4x4 avec chauffeurs Touareg",
    },
    accommodations: [
      { name: "Campement Tassili", category: "Lodge", pension: "Pension complète" },
      { name: "Bivouac Erg Admer", category: "Bivouac luxe", pension: "Pension complète" },
    ],
    pricing: [
      { label: "Adulte", subLabel: "Base double", unitPrice: 245000, commission: 15000 },
      { label: "Single", subLabel: "Sous tente", unitPrice: 285000, commission: 17000 },
      { label: "Enfant", subLabel: "8-11 ans", unitPrice: 195000, commission: 9000 },
    ],
    agencyCommissions: {
      adulte: { t1: 11000, t2: 12500, t3: 14500 },
      enfant: 7000,
      bebe: 0,
    },
    content: {
      included: ["Vols intérieurs", "Guides Touareg", "Pension complète", "Assurance assistance désert"],
      excluded: ["Pourboires équipe locale", "Assurance annulation"],
      excursionsIncluded: ["Canyon d'Essendilène", "Gravures rupestres"],
      excursionsExtra: ["Survol hélico Tassili", "Nuit privée au bivouac luxe"],
    },
    itinerary: {
      active: true,
      days: [
        { dayNumber: 1, description: "Arrivée Djanet, transfert 4x4, installation campement." },
        { dayNumber: 3, description: "Randonnée dômes de Tadrart, coucher de soleil." },
        { dayNumber: 6, description: "Bivouac Erg Admer, veillée touareg." },
      ],
      partnerName: "Sahara Nomads DMC",
      emergencyContact: "+213 770 123 456",
      internalNotes: "Vérifier autorisations drones. Prévoir caisses eau supplémentaires.",
      clientInformation: "Températures fraîches la nuit, sacs couchage -5°C fournis.",
    },
    opsProject: {
      id: "ops-sahara",
      packageId: "pkg-sahara-1125",
      groups: [
        {
          id: "ops-sahara-1",
          flightLabel: "Air Algérie - départ 2025-11-08",
          departureDate: "2025-11-08",
          status: "pending_validation",
          suppliers: [
            { name: "Camp Tassili", contact: "resa@tassili.com", cost: 680000, deadline: "2025-09-15" },
            { name: "Equipe 4x4", contact: "ops@saharanomads.dz", cost: 320000, deadline: "2025-09-01" },
          ],
          costs: [
            { label: "Autorisation sud", amount: 120000, dueDate: "2025-08-20", paid: true },
            { label: "Location 4x4", amount: 320000, dueDate: "2025-09-01", paid: false },
          ],
          timeline: [
            { title: "Groupe créé", date: "2025-04-02", note: "Raid novembre", kind: "info" },
            { title: "Brief sécurité validé", date: "2025-05-01", kind: "done" },
          ],
        },
      ],
    },
  },
  {
    id: "pkg-bali-0126",
    status: "draft",
    general: {
      productName: "Bali Slow Life & Ubud",
      productCode: "BALI-0126",
      responsible: "Sabrina Hachemi",
      creationDate: "2025-03-12T09:00:00.000Z",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
      stock: 32,
    },
    flights: {
      destination: "Indonésie",
      cities: ["Ubud", "Seminyak"],
      flights: [
        {
          airline: "Qatar Airways",
          departureDate: "2026-01-18",
          returnDate: "2026-01-29",
          duration: "12j/10n",
          details: "ALG-DOH-DPS, bagages 30kg",
        },
      ],
      visaStatus: "eVOA à l'arrivée",
      transferStatus: "Transferts privés inclus",
    },
    accommodations: [
      { name: "Alaya Resort", category: "4*", pension: "Petit-déjeuner" },
      { name: "Potato Head Suites", category: "5*", pension: "Petit-déjeuner" },
    ],
    pricing: [
      { label: "Adulte", subLabel: "Base double", unitPrice: 315000, commission: 22000 },
      { label: "Enfant", subLabel: "2-11 ans", unitPrice: 255000, commission: 14000 },
      { label: "Bébé", subLabel: "-2 ans", unitPrice: 65000, commission: 3500 },
    ],
    agencyCommissions: {
      adulte: { t1: 14000, t2: 16500, t3: 18500 },
      enfant: 9000,
      bebe: 3500,
    },
    content: {
      included: ["Vols Qatar", "10 nuits d'hôtels", "Assurance assistance"],
      excluded: ["Repas non mentionnés", "Taxes locales"],
      excursionsIncluded: ["Balade rizières Tegallalang", "Cours de cuisine balinaise"],
      excursionsExtra: ["Survol Ubud en hélico", "Plongée Nusa Penida"],
    },
    itinerary: {
      active: false,
      days: [
        { dayNumber: 1, description: "Arrivée et transfert Ubud." },
        { dayNumber: 5, description: "Rafting Ayung optionnel." },
      ],
      partnerName: "Wonderful Bali DMC",
      emergencyContact: "+62 812-3456-7890",
      internalNotes: "Tarifs en attente de validation Qatar early booking.",
      clientInformation: "Programme ajustable selon vols du jour.",
    },
  },
];

export const mockBookings: Booking[] = [
  {
    id: "bkg-lis-001",
    packageId: "pkg-lisbonne-0625",
    bookingType: "Confirmée",
    rooms: [
      { roomType: "Double", occupants: [{ type: "ADL", name: "Samir M." }, { type: "ADL", name: "Amel K." }] },
      { roomType: "Single", occupants: [{ type: "ADL", name: "Nadia B." }] },
    ],
    paxTotal: 3,
    uploads: {
      passportScans: ["samir-passport.pdf", "amel-passport.pdf"],
      requiredDocuments: ["Formulaire TAP"],
      paymentProofUrl: "recu-virement-001.pdf",
    },
    payment: {
      paymentMethod: "Virement",
      totalPrice: 555000,
      paidAmount: 420000,
      isFullyPaid: false,
    },
    createdAt: "2025-03-05T09:30:00.000Z",
  },
  {
    id: "bkg-lis-002",
    packageId: "pkg-lisbonne-0625",
    bookingType: "En option",
    reservedUntil: "2025-05-12",
    rooms: [
      { roomType: "Twin", occupants: [{ type: "ADL", name: "Yacine T." }, { type: "ADL", name: "Lina Z." }] },
      { roomType: "Child", occupants: [{ type: "CHD", name: "Rania T." }] },
    ],
    paxTotal: 3,
    uploads: {
      passportScans: ["yacine-passport.pdf"],
      requiredDocuments: ["Autorisation parentale"],
      paymentProofUrl: "",
    },
    payment: {
      paymentMethod: "Carte",
      totalPrice: 505000,
      paidAmount: 0,
      isFullyPaid: false,
    },
    createdAt: "2025-03-22T15:10:00.000Z",
  },
  {
    id: "bkg-sahara-001",
    packageId: "pkg-sahara-1125",
    bookingType: "Confirmée",
    rooms: [
      { roomType: "Twin", occupants: [{ type: "ADL", name: "Imene L." }, { type: "ADL", name: "Lamia L." }] },
      { roomType: "Child", occupants: [{ type: "CHD", name: "Riad L." }] },
    ],
    paxTotal: 3,
    uploads: {
      passportScans: ["imene-passport.pdf"],
      requiredDocuments: ["Autorisation sud"],
      paymentProofUrl: "recu-sahara-001.pdf",
    },
    payment: {
      paymentMethod: "Espèces",
      totalPrice: 715000,
      paidAmount: 715000,
      isFullyPaid: true,
    },
    createdAt: "2025-04-02T08:00:00.000Z",
  },
];
