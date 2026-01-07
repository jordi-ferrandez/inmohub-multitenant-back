/**
 * Mappers de Versión CSV
 *
 * Cada mapper convierte una versión específica del CSV al formato estándar interno.
 * Esto permite que el resto del sistema siempre trabaje con el mismo formato,
 * independientemente de la versión del CSV recibido.
 */

import { StandardCSVRecord } from "../types/csvVersions";
import { CSVVersion } from "../types/csvVersions";

/**
 * Tipo genérico para una fila CSV sin formato específico
 */
export type RawCSVRow = Record<string, string | null>;

/**
 * Mapea una fila de la Versión 1 al formato estándar
 * (La versión 1 ya es el formato estándar, pero normalizamos valores)
 */
export function mapVersion1ToStandard(row: RawCSVRow): StandardCSVRecord {
  return {
    "Calle Prop": String(row["Calle Prop"] || "").trim(),
    "Calle Prop Num": parseInt(String(row["Calle Prop Num"] || "0"), 10),
    "Calle Bloque": String(row["Calle Bloque"] || "").trim(),
    "Calle Prop esc": row["Calle Prop esc"]
      ? String(row["Calle Prop esc"]).trim()
      : null,

    Codigo: parseInt(String(row["Codigo"] || "0"), 10),
    Puerta: String(row["Puerta"] || "").trim(),
    "Calle prop Planta": parseInt(String(row["Calle prop Planta"] || "0"), 10),
    "Precio Inmobiliaria": parseInt(
      String(row["Precio Inmobiliaria"] || "0"),
      10
    ),
    "Precio Alquiler": parseInt(String(row["Precio Alquiler"] || "0"), 10),
    Valoracion: parseInt(String(row["Valoracion"] || "0"), 10),
    "PISO VACIO": parseInt(String(row["PISO VACIO"] || "0"), 10),
    "INQUILINO OCUPADO": parseInt(String(row["INQUILINO OCUPADO"] || "0"), 10),
    "PROPIETARIO OCUPADO": parseInt(
      String(row["PROPIETARIO OCUPADO"] || "0"),
      10
    ),
    "2ªRESIDENCIA OCUPADO": parseInt(
      String(row["2ªRESIDENCIA OCUPADO"] || "0"),
      10
    ),
    "ALQUILADO EVERLY": parseInt(String(row["ALQUILADO EVERLY"] || "0"), 10),
    "VENDIDO EVERLY": parseInt(String(row["VENDIDO EVERLY"] || "0"), 10),

    "Nombre Cliente": String(row["Nombre Cliente"] || "").trim(),
    Apellidos: String(row["Apellidos"] || "").trim(),
    "Email Cliente": String(row["Email Cliente"] || "").trim(),
    "Teléfono Cliente": String(row["Teléfono Cliente"] || "").trim(),
    "Telf. Movil Cliente": String(row["Telf. Movil Cliente"] || "").trim(),
    "Telf. Trab. Cliente": row["Telf. Trab. Cliente"]
      ? String(row["Telf. Trab. Cliente"]).trim()
      : null,
    "Observación Cliente": String(row["Observación Cliente"] || "").trim(),
    "Aviso Importante Cliente": String(
      row["Aviso Importante Cliente"] || row["Aviso Importante"] || ""
    ).trim(),

    "NOTICIA ALQUILER": parseInt(String(row["NOTICIA ALQUILER"] || "0"), 10),
    "NOTICIA VENTA": parseInt(String(row["NOTICIA VENTA"] || "0"), 10),
    INFORMADOR: parseInt(String(row["INFORMADOR"] || "0"), 10),

    "Apellidos Captador": String(
      row["Apellidos Captador"] || row["Apellidos"] || ""
    ).trim(),
    "Nombre Captador": String(
      row["Nombre Captador"] || row["Nombre"] || ""
    ).trim(),
    "Sucursal Captador": parseInt(
      String(row["Sucursal Captador"] || row["Sucursal"] || "0"),
      10
    ),
    "Cerrado por": String(row["Cerrado por"] || "").trim(),
    Colaborador: String(row["Colaborador"] || "").trim(),
    "Medio Contacto": String(row["Medio Contacto"] || "").trim(),
  };
}

/**
 * Mapea una fila de la Versión 2 al formato estándar
 * Diferencias principales:
 * - "Tel fono Cliente" (sin tilde) -> "Teléfono Cliente"
 * - "Observaci n Cliente" (sin tilde) -> "Observación Cliente"
 * - "2 RESIDENCIA OCUPADO" (sin ª) -> "2ªRESIDENCIA OCUPADO"
 * - "Aviso Importante Cliente" (nombre completo)
 * - "Apellidos Captador", "Nombre Captador", "Sucursal Captador" (nombres explícitos)
 * - No tiene "Telf. Trab. Cliente"
 */
export function mapVersion2ToStandard(row: RawCSVRow): StandardCSVRecord {
  return {
    "Calle Prop": String(row["Calle Prop"] || "").trim(),
    "Calle Prop Num": parseInt(String(row["Calle Prop Num"] || "0"), 10),
    "Calle Bloque": String(row["Calle Bloque"] || "").trim(),
    "Calle Prop esc": row["Calle Prop esc"]
      ? String(row["Calle Prop esc"]).trim()
      : null,

    Codigo: parseInt(String(row["Codigo"] || "0"), 10),
    Puerta: String(row["Puerta"] || "").trim(),
    "Calle prop Planta": parseInt(String(row["Calle prop Planta"] || "0"), 10),
    "Precio Inmobiliaria": parseInt(
      String(row["Precio Inmobiliaria"] || "0"),
      10
    ),
    "Precio Alquiler": parseInt(String(row["Precio Alquiler"] || "0"), 10),
    Valoracion: parseInt(String(row["Valoracion"] || "0"), 10),
    "PISO VACIO": parseInt(String(row["PISO VACIO"] || "0"), 10),
    "INQUILINO OCUPADO": parseInt(String(row["INQUILINO OCUPADO"] || "0"), 10),
    "PROPIETARIO OCUPADO": parseInt(
      String(row["PROPIETARIO OCUPADO"] || "0"),
      10
    ),
    // Mapear "2 RESIDENCIA OCUPADO" (sin ª) a "2ªRESIDENCIA OCUPADO"
    "2ªRESIDENCIA OCUPADO": parseInt(
      String(row["2 RESIDENCIA OCUPADO"] || row["2ªRESIDENCIA OCUPADO"] || "0"),
      10
    ),
    "ALQUILADO EVERLY": parseInt(String(row["ALQUILADO EVERLY"] || "0"), 10),
    "VENDIDO EVERLY": parseInt(String(row["VENDIDO EVERLY"] || "0"), 10),

    "Nombre Cliente": String(row["Nombre Cliente"] || "").trim(),
    Apellidos: String(row["Apellidos"] || "").trim(),
    "Email Cliente": String(row["Email Cliente"] || "").trim(),
    // Mapear "Tel fono Cliente" (sin tilde) a "Teléfono Cliente"
    "Teléfono Cliente": String(
      row["Tel fono Cliente"] || row["Teléfono Cliente"] || ""
    ).trim(),
    "Telf. Movil Cliente": String(row["Telf. Movil Cliente"] || "").trim(),
    "Telf. Trab. Cliente": null, // No existe en v2
    // Mapear "Observaci n Cliente" (sin tilde) a "Observación Cliente"
    "Observación Cliente": String(
      row["Observaci n Cliente"] || row["Observación Cliente"] || ""
    ).trim(),
    "Aviso Importante Cliente": String(
      row["Aviso Importante Cliente"] || ""
    ).trim(),

    "NOTICIA ALQUILER": parseInt(String(row["NOTICIA ALQUILER"] || "0"), 10),
    "NOTICIA VENTA": parseInt(String(row["NOTICIA VENTA"] || "0"), 10),
    INFORMADOR: parseInt(String(row["INFORMADOR"] || "0"), 10),

    "Apellidos Captador": String(row["Apellidos Captador"] || "").trim(),
    "Nombre Captador": String(row["Nombre Captador"] || "").trim(),
    "Sucursal Captador": parseInt(String(row["Sucursal Captador"] || "0"), 10),
    "Cerrado por": String(row["Cerrado por"] || "").trim(),
    Colaborador: String(row["Colaborador"] || "").trim(),
    "Medio Contacto": String(row["Medio Contacto"] || "").trim(),
  };
}

/**
 * Mapea una fila de la Versión 3 al formato estándar
 * Diferencias principales:
 * - "Altura" en lugar de "Calle prop Planta"
 * - Mismas diferencias de encoding que v2
 */
export function mapVersion3ToStandard(row: RawCSVRow): StandardCSVRecord {
  const v2Mapped = mapVersion2ToStandard(row);

  // La única diferencia es que "Altura" reemplaza "Calle prop Planta"
  return {
    ...v2Mapped,
    "Calle prop Planta": parseInt(String(row["Altura"] || "0"), 10),
  };
}

/**
 * Mapea una fila CSV al formato estándar según su versión
 */
export function mapRowToStandard(
  row: RawCSVRow,
  version: CSVVersion
): StandardCSVRecord {
  switch (version) {
    case "v1":
      return mapVersion1ToStandard(row);
    case "v2":
      return mapVersion2ToStandard(row);
    case "v3":
      return mapVersion3ToStandard(row);
    case "unknown":
      // Intentar mapear como v1 por defecto (formato estándar)
      // Esto puede fallar, pero es mejor que nada
      console.warn(
        "[CSV Parser] Versión desconocida, intentando mapear como v1"
      );
      return mapVersion1ToStandard(row);
    default:
      throw new Error(`Versión CSV no soportada: ${version}`);
  }
}
