import { DateTime } from "luxon";

/**
 * Normaliza una fecha de solo día (YYYY-MM-DD) a UTC medianoche
 * Interpreta la fecha como medianoche en el timezone del usuario
 *
 * @param dateString - String en formato YYYY-MM-DD o Date object
 * @param userTimezone - Timezone del usuario (ej: "America/Caracas", "Europe/Madrid")
 * @returns Date object en UTC
 *
 * @example
 * // Usuario en Venezuela (UTC-4) selecciona: 22/11/2025
 * normalizeDateToUTC("2025-11-22", "America/Caracas")
 * // → 2025-11-22T04:00:00.000Z (medianoche en Caracas = 04:00 UTC)
 */
export function normalizeDateToUTC(
  dateString: string | Date,
  userTimezone?: string
): Date {
  // Si ya es un Date object, retornarlo
  if (dateString instanceof Date) {
    return dateString;
  }

  // Si es string YYYY-MM-DD, interpretarlo como medianoche en timezone del usuario
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    if (userTimezone) {
      // Usar timezone del usuario si está disponible
      const localMidnight = DateTime.fromISO(dateString, {
        zone: userTimezone,
      }).startOf("day");
      return localMidnight.toUTC().toJSDate();
    }

    // Si no hay timezone, interpretar como UTC medianoche directamente
    // Esto es más seguro que usar el timezone del servidor
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  // Si ya es ISO string completo, parsearlo normalmente
  // Luxon maneja automáticamente el timezone si está incluido
  const parsed = DateTime.fromISO(dateString);
  if (parsed.isValid) {
    return parsed.toUTC().toJSDate();
  }

  // Fallback: parseo estándar de JavaScript
  return new Date(dateString);
}

/**
 * Convierte una fecha UTC a string en formato YYYY-MM-DD
 * Útil para extraer solo la fecha sin problemas de timezone
 *
 * @param date - Date object o ISO string
 * @returns String en formato YYYY-MM-DD
 */
export function formatDateOnly(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el timezone del usuario desde el header de la request
 * Si no está disponible, retorna undefined
 *
 * @param timezoneHeader - Header "X-User-Timezone" o similar
 * @returns Timezone string (ej: "America/Caracas") o undefined
 */
export function getUserTimezone(timezoneHeader?: string): string | undefined {
  if (!timezoneHeader) {
    return undefined;
  }

  // Validar que sea un timezone válido
  try {
    DateTime.now().setZone(timezoneHeader);
    return timezoneHeader;
  } catch {
    return undefined;
  }
}

/**
 * Convierte una fecha UTC a la zona horaria del usuario
 * Útil para mostrar fechas en el frontend
 *
 * @param date - Date object o ISO string en UTC
 * @param userTimezone - Timezone del usuario
 * @returns DateTime object en el timezone del usuario
 */
export function toUserTimezone(
  date: Date | string,
  userTimezone: string
): DateTime {
  const dateObj = date instanceof Date ? date : new Date(date);
  return DateTime.fromJSDate(dateObj, { zone: "utc" }).setZone(userTimezone);
}
