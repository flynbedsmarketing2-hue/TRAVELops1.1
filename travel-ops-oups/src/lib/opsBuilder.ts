export type FlightSegment = {
  airline: string;
  departureDate: string;
  returnDate: string;
};

export type DepartureSnapshot = {
  id: string;
  airline: string | null;
  departureDate: Date | null;
  returnDate: Date | null;
  flightLabel: string;
};

export function flightStructureKey(flight: FlightSegment) {
  return `${flight.departureDate || ""}|${flight.airline || ""}|${flight.returnDate || ""}`;
}

export function departureStructureKey(departure: DepartureSnapshot) {
  return `${departure.departureDate?.toISOString().slice(0, 10) || ""}|${departure.airline || ""}|${
    departure.returnDate?.toISOString().slice(0, 10) || ""
  }`;
}

export function hasFlightStructureChanged(previous: FlightSegment[], next: FlightSegment[]) {
  if (previous.length !== next.length) return true;
  const previousCounts = new Map<string, number>();
  previous.forEach((flight) => {
    const key = flightStructureKey(flight);
    previousCounts.set(key, (previousCounts.get(key) ?? 0) + 1);
  });

  const nextCounts = new Map<string, number>();
  next.forEach((flight) => {
    const key = flightStructureKey(flight);
    nextCounts.set(key, (nextCounts.get(key) ?? 0) + 1);
  });

  if (previousCounts.size !== nextCounts.size) return true;
  for (const [key, count] of previousCounts) {
    if (nextCounts.get(key) !== count) return true;
  }
  return false;
}

export function buildDeparturesFromFlights(flights: FlightSegment[]) {
  return flights.map((flight, idx) => ({
    flightLabel: `${flight.airline} - depart ${flight.departureDate}`,
    airline: flight.airline ?? null,
    departureDate: flight.departureDate ? new Date(flight.departureDate) : null,
    returnDate: flight.returnDate ? new Date(flight.returnDate) : null,
    timelineItems: {
      create: [
        {
          title: "Groupe cree",
          date: new Date(),
          note: `Vol ${idx + 1}`,
          kind: "info",
        },
      ],
    },
  }));
}
