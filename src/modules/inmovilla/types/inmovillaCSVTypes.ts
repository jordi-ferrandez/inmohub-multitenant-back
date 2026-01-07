import { ApiResponse } from "../../../core/types";
import { StandardCSVRecord } from "./csvVersions";

// DTO para fila CSV - Usa el formato estándar interno
export type InmovillaCSVRecord = StandardCSVRecord;

// DTO para respuesta de importación
export type ImportDTO = {
  totalRecords: number;
  buildingsCreated: number;
  buildingsExisting: number;
  propertiesCreated: number;
  propertiesExisting: number;
  clientsCreated: number;
  clientsExisting: number;
  ownershipsCreated: number;
  errors: ImportError[];
  processingTimeMs?: number;
  csvVersion?: string; // Versión detectada del CSV (v1, v2, v3, unknown)
};

// Error agrupado por tipo
export type ImportError = {
  type: "building" | "property" | "client" | "captador" | "general" | "parsing" | "validation" | "info";
  message: string;
  context?: string; // Código de propiedad, nombre de edificio, etc.
  rowNumber?: number; // Número de fila donde ocurrió el error (1-indexed, incluyendo header)
  columnName?: string; // Nombre de la columna que causó el error (para errores de parsing)
  severity: "error" | "warning" | "info"; // Severidad del error: error (crítico), warning (advertencia), info (información)
};

// Tipo para respuesta API
export type ImportResponseDTO = ApiResponse<ImportDTO>;

export type BuilindingInCSVDTO = {
  street: string; // Calle Prop
  number: number; // Calle Prop Num
  block: string | null; // Calle Bloque
  stair: string | null; // Calle Prop Esc
};

export type PropertyInCSVDTO = {
  inmovillaCode: number;
  number: string;
  floor: number;
  appraisalPrice: number | null;
  occupiedBy: string | null;
  importantNotice: string | null;
  rso_comment: string | null;
  soldRentedUs: boolean;
  branch: string | null;
};

export type ClientInCSVDTO = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  mobilePhone: string;
  isInformer: boolean;
};

export type CaptadorInCSVDTO = {
  firstName: string;
  lastName: string;
  branch: string | null;
  closedBy: string | null;
  employee: string | null;
};

export type PropertyWithRelations = {
  property: PropertyInCSVDTO;
  client: ClientInCSVDTO;
  captador: CaptadorInCSVDTO;
  rowNumber?: number; // Número de fila en el CSV (1-indexed, incluyendo header)
  originalRecord?: InmovillaCSVRecord; // Record original del CSV para rastrear columnas
};

export type BuildingProcessingUnit = {
  building: BuilindingInCSVDTO;
  propertiesWithRelations: PropertyWithRelations[];
  firstRowNumber?: number; // Número de fila de la primera propiedad que creó este edificio
};

export type ParsedCSVData = {
  buildingsMap: Map<BuildingKey, BuildingProcessingUnit>;
  streets: Set<string>;
  totalRecords: number;
  csvVersion?: string; // Versión detectada del CSV (v1, v2, v3, unknown)
  parsingErrors?: ImportError[]; // Errores de parsing (columnas faltantes, tipos incorrectos, etc.)
};

export type BuildingKey = string;
