export function mapBookingTypeToDb(type: string) {
  if (type === "En option") return "En_option";
  if (type === "Confirmée" || type === "Confirmee") return "Confirmee";
  return "En_option";
}

export function mapBookingTypeToUi(type: string) {
  if (type === "Confirmee") return "Confirmée";
  if (type === "En_option") return "En option";
  return type;
}
