import { formatInTimeZone } from "date-fns-tz";

export const TZ = process.env.TZ || "America/Asuncion";

export function isoToDate(isoOrString: string) {
  // Acepta "2025-10-22T18:30" o ISO completo
  return new Date(isoOrString);
}

export function formatTz(date: Date, fmt = "dd/MM/yyyy HH:mm") {
  return formatInTimeZone(date, TZ, fmt);
}
