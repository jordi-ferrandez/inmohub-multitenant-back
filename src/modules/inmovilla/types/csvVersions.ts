/**
 * Sistema de Versiones de CSV - Inmovilla Import
 *
 * Este sistema permite manejar múltiples versiones del formato CSV.
 * Cada versión se mapea a un formato estándar interno para mantener
 * la compatibilidad con el resto del sistema.
 */

// ============================================================================
// FORMATO ESTÁNDAR INTERNO (basado en Versión 1)
// ============================================================================

/**
 * Formato estándar interno que usa el sistema.
 * Basado en la Versión 1 del CSV (formato original de desarrollo).
 */
export type StandardCSVRecord = {
  // Edificio
  "Calle Prop": string;
  "Calle Prop Num": number;
  "Calle Bloque": string;
  "Calle Prop esc": string | null;

  // Propiedad
  Codigo: number;
  Puerta: string;
  "Calle prop Planta": number;
  "Precio Inmobiliaria": number;
  "Precio Alquiler": number;
  Valoracion: number;
  "PISO VACIO": number;
  "INQUILINO OCUPADO": number;
  "PROPIETARIO OCUPADO": number;
  "2ªRESIDENCIA OCUPADO": number;
  "ALQUILADO EVERLY": number;
  "VENDIDO EVERLY": number;

  // Cliente
  "Nombre Cliente": string;
  Apellidos: string;
  "Email Cliente": string;
  "Teléfono Cliente": string;
  "Telf. Movil Cliente": string;
  "Telf. Trab. Cliente": string | null; // Opcional en algunas versiones
  "Observación Cliente": string;
  "Aviso Importante Cliente": string;

  // Noticias
  "NOTICIA ALQUILER": number;
  "NOTICIA VENTA": number;
  INFORMADOR: number;

  // Captador
  "Apellidos Captador": string;
  "Nombre Captador": string;
  "Sucursal Captador": number;
  "Cerrado por": string;
  Colaborador: string;
  "Medio Contacto": string;
};

// ============================================================================
// DEFINICIÓN DE VERSIONES
// ============================================================================

export type CSVVersion = "v1" | "v2" | "v3" | "unknown";

/**
 * Definición de columnas por versión
 */
export interface CSVVersionDefinition {
  version: CSVVersion;
  name: string;
  description: string;
  columns: string[]; // Columnas exactas en orden
  requiredColumns: string[]; // Columnas obligatorias
  optionalColumns: string[]; // Columnas opcionales
}

/**
 * Versión 1: Formato original
 */
export const CSV_VERSION_1: CSVVersionDefinition = {
  version: "v1",
  name: "Versión 1 (Original)",
  description: "Formato original con que se desarrolló el sistema",
  columns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Calle prop Planta",
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
    "Teléfono Cliente",
    "Telf. Movil Cliente",
    "Telf. Trab. Cliente",
    "Observación Cliente",
    "Aviso Importante",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2ªRESIDENCIA OCUPADO",
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos",
    "Sucursal",
    "Nombre",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
  requiredColumns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Calle prop Planta",
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
  ],
  optionalColumns: [
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Teléfono Cliente",
    "Telf. Movil Cliente",
    "Telf. Trab. Cliente",
    "Observación Cliente",
    "Aviso Importante",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2ªRESIDENCIA OCUPADO",
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos",
    "Sucursal",
    "Nombre",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
};

/**
 * Versión 2: Cambios en nombres de columnas
 */
export const CSV_VERSION_2: CSVVersionDefinition = {
  version: "v2",
  name: "Versión 2",
  description:
    "Cambios en nombres de columnas (sin Telf. Trab. Cliente, cambios en nombres)",
  columns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Calle prop Planta",
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
    "Tel fono Cliente", // Nota: sin tilde (problema de encoding)
    "Telf. Movil Cliente",
    "Observaci n Cliente", // Nota: sin tilde
    "Aviso Importante Cliente",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2 RESIDENCIA OCUPADO", // Nota: sin ª
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos Captador",
    "Sucursal Captador",
    "Nombre Captador",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
  requiredColumns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Calle prop Planta",
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
  ],
  optionalColumns: [
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Tel fono Cliente",
    "Telf. Movil Cliente",
    "Observaci n Cliente",
    "Aviso Importante Cliente",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2 RESIDENCIA OCUPADO",
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos Captador",
    "Sucursal Captador",
    "Nombre Captador",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
};

/**
 * Versión 3: Cambio de "Calle prop Planta" por "Altura"
 */
export const CSV_VERSION_3: CSVVersionDefinition = {
  version: "v3",
  name: "Versión 3",
  description: "Cambio de 'Calle prop Planta' por 'Altura'",
  columns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Altura", // CAMBIO: Era "Calle prop Planta"
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
    "Tel fono Cliente",
    "Telf. Movil Cliente",
    "Observaci n Cliente",
    "Aviso Importante Cliente",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2 RESIDENCIA OCUPADO",
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos Captador",
    "Sucursal Captador",
    "Nombre Captador",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
  requiredColumns: [
    "Codigo",
    "Calle Prop",
    "Calle Prop Num",
    "Altura", // CAMBIO: Era "Calle prop Planta"
    "Nombre Cliente",
    "Apellidos",
    "Email Cliente",
  ],
  optionalColumns: [
    "Calle Bloque",
    "Calle Prop esc",
    "Puerta",
    "Tel fono Cliente",
    "Telf. Movil Cliente",
    "Observaci n Cliente",
    "Aviso Importante Cliente",
    "NOTICIA ALQUILER",
    "NOTICIA VENTA",
    "INFORMADOR",
    "INQUILINO OCUPADO",
    "PROPIETARIO OCUPADO",
    "2 RESIDENCIA OCUPADO",
    "ALQUILADO EVERLY",
    "VENDIDO EVERLY",
    "PISO VACIO",
    "Apellidos Captador",
    "Sucursal Captador",
    "Nombre Captador",
    "Cerrado por",
    "Colaborador",
    "Medio Contacto",
    "Precio Inmobiliaria",
    "Precio Alquiler",
    "Valoracion",
  ],
};

/**
 * Todas las versiones conocidas
 */
export const CSV_VERSIONS: CSVVersionDefinition[] = [
  CSV_VERSION_1,
  CSV_VERSION_2,
  CSV_VERSION_3,
];

// ============================================================================
// UTILIDADES DE DETECCIÓN Y VALIDACIÓN
// ============================================================================

/**
 * Resultado de la detección de versión
 */
export interface VersionDetectionResult {
  version: CSVVersion;
  definition: CSVVersionDefinition | null;
  confidence: number; // 0-1, qué tan seguro estamos de la versión
  missingColumns: string[];
  extraColumns: string[];
  matchedColumns: string[];
}

/**
 * Detecta la versión del CSV basándose en las columnas presentes
 */
export function detectCSVVersion(headers: string[]): VersionDetectionResult {
  const normalizedHeaders = headers.map((h) => h.trim());

  let bestMatch: VersionDetectionResult | null = null;
  let bestScore = 0;

  for (const versionDef of CSV_VERSIONS) {
    const matchedColumns = normalizedHeaders.filter((h) =>
      versionDef.columns.includes(h)
    );
    const missingColumns = versionDef.requiredColumns.filter(
      (col) => !normalizedHeaders.includes(col)
    );
    const extraColumns = normalizedHeaders.filter(
      (col) => !versionDef.columns.includes(col)
    );

    // Calcular score: porcentaje de columnas requeridas presentes
    const requiredScore =
      versionDef.requiredColumns.length > 0
        ? (versionDef.requiredColumns.length - missingColumns.length) /
          versionDef.requiredColumns.length
        : 0;

    // Penalizar columnas extra
    const extraPenalty = extraColumns.length > 0 ? 0.1 : 0;

    const totalScore = Math.max(0, requiredScore - extraPenalty);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = {
        version: versionDef.version,
        definition: versionDef,
        confidence: totalScore,
        missingColumns,
        extraColumns,
        matchedColumns,
      };
    }
  }

  // Si no hay match bueno, retornar unknown
  if (!bestMatch || bestScore < 0.5) {
    return {
      version: "unknown",
      definition: null,
      confidence: 0,
      missingColumns: [],
      extraColumns: normalizedHeaders,
      matchedColumns: [],
    };
  }

  return bestMatch;
}

/**
 * Valida que el CSV tenga las columnas mínimas requeridas
 */
export function validateCSVStructure(
  headers: string[],
  version: CSVVersionDefinition
): {
  isValid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  extraColumns: string[];
} {
  const normalizedHeaders = headers.map((h) => h.trim());

  const missingRequired = version.requiredColumns.filter(
    (col) => !normalizedHeaders.includes(col)
  );

  const missingOptional = version.optionalColumns.filter(
    (col) => !normalizedHeaders.includes(col)
  );

  const extraColumns = normalizedHeaders.filter(
    (col) =>
      !version.requiredColumns.includes(col) &&
      !version.optionalColumns.includes(col)
  );

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    extraColumns,
  };
}
