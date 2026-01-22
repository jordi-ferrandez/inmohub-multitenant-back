import * as XLSX from "xlsx";
import {
  BuildingKey,
  BuildingProcessingUnit,
  BuilindingInCSVDTO,
  CaptadorInCSVDTO,
  ClientInCSVDTO,
  InmovillaCSVRecord,
  ParsedCSVData,
  PropertyInCSVDTO,
  PropertyWithRelations,
  ImportError,
} from "../types";
import { getBuildingKey } from "./getBuildingKey";
import { mapBuilding, mapCaptador, mapClient, mapProperty } from "./mappers";
import {
  detectCSVVersion,
  validateCSVStructure,
  CSVVersion,
} from "../types/csvVersions";
import { mapRowToStandard, RawCSVRow } from "./versionMappers";

/**
 * Parsea un archivo Excel (.xlsx o .xls) con el formato de Inmovilla
 */
export const parseInmovillaExcel = async (filePath: string): Promise<ParsedCSVData> => {
  try {
    // 1. Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];

    // 2. Convertir a JSON (objetos con las columnas como keys)
    // Usamos raw: true para mantener tipos originales si es posible, 
    // pero el resto del sistema espera strings o nulls similares al CSV
    const rows = XLSX.utils.sheet_to_json<any>(datasheet, {
      defval: null,
    });

    if (rows.length === 0) {
      throw new Error("El archivo Excel está vacío.");
    }

    // Obtener headers de la primera fila
    const headers = Object.keys(rows[0]);
    
    // 3. Detectar versión (reutilizando la lógica de CSV)
    const versionDetection = detectCSVVersion(headers);

    console.log(
      `[Parse Excel] Versión detectada: ${
        versionDetection.version
      } (confianza: ${Math.round(versionDetection.confidence * 100)}%)`
    );

    // 4. Validar estructura
    if (versionDetection.definition) {
      const validation = validateCSVStructure(
        headers,
        versionDetection.definition
      );

      if (!validation.isValid) {
        const errorMessage =
          `El archivo Excel no tiene la estructura correcta para la versión ${versionDetection.version}.\n` +
          `Columnas requeridas faltantes: ${validation.missingRequired.join(
            ", "
          )}`;

        console.error(`[Parse Excel] ${errorMessage}`);
        throw new Error(errorMessage);
      }
    }

    // 5. Procesar los datos
    const result: ParsedCSVData = {
      buildingsMap: new Map<BuildingKey, BuildingProcessingUnit>(),
      streets: new Set<string>(),
      totalRecords: rows.length,
      csvVersion: versionDetection.version,
      parsingErrors: [],
    };

    const { buildingsMap, streets } = result;
    const csvVersion: CSVVersion = versionDetection.version;
    let skippedRecords = 0;

    rows.forEach((rowData, index) => {
      const rowNumber = index + 2; // +1 por 0-index, +1 por el header

      try {
        // Convertir rowData a RawCSVRow (asegurar que todo sea string o null para los mappers)
        const rawRow: RawCSVRow = {};
        for (const key in rowData) {
          const val = rowData[key];
          rawRow[key] = val !== null && val !== undefined ? String(val).trim() : null;
        }

        // 6. Mapear fila a formato estándar según versión
        const record: InmovillaCSVRecord = mapRowToStandard(rawRow, csvVersion);

        // 7. Mapear a DTOs internos
        const building: BuilindingInCSVDTO = mapBuilding(record);
        const property: PropertyInCSVDTO = mapProperty(record);
        const client: ClientInCSVDTO = mapClient(record);
        const captador: CaptadorInCSVDTO = mapCaptador(record);

        const propertyWithRelations: PropertyWithRelations = {
          property,
          client,
          captador,
          originalRecord: record,
        };

        // 8. Validación de edificio
        const isValidBuilding =
          building.number !== null &&
          !isNaN(building.number) &&
          building.street &&
          building.street.trim().length > 1;

        // 9. Validación de propiedad
        const isValidProperty =
          property.inmovillaCode !== null &&
          !isNaN(property.inmovillaCode) &&
          property.inmovillaCode > 0;

        if (!isValidBuilding || !isValidProperty) {
          skippedRecords++;
          if (!isValidBuilding) {
            result.parsingErrors?.push({
              type: "validation",
              message: `Edificio inválido en fila ${rowNumber}: calle "${building.street}", número ${building.number}`,
              context: `Fila ${rowNumber}`,
              rowNumber,
              severity: "error",
            });
          }
          if (!isValidProperty) {
            result.parsingErrors?.push({
              type: "validation",
              message: `Propiedad inválida en fila ${rowNumber}: código ${property.inmovillaCode}`,
              context: `Fila ${rowNumber}`,
              rowNumber,
              severity: "error",
            });
          }
          return;
        }

        const buildingKey = getBuildingKey(building);
        streets.add(building.street);

        if (!buildingsMap.has(buildingKey)) {
          buildingsMap.set(buildingKey, {
            building,
            propertiesWithRelations: [],
            firstRowNumber: rowNumber,
          });
        }

        const buildingData = buildingsMap.get(buildingKey)!;

        // Validar duplicados
        const isDuplicate = buildingData.propertiesWithRelations.some(
          (p) => p.property.inmovillaCode === property.inmovillaCode
        );

        if (isDuplicate) {
          skippedRecords++;
          result.parsingErrors?.push({
            type: "validation",
            message: `Propiedad duplicada en fila ${rowNumber}: código ${property.inmovillaCode}`,
            context: `Fila ${rowNumber}, Edificio: ${buildingKey}`,
            rowNumber,
            severity: "warning",
          });
          return;
        }

        propertyWithRelations.rowNumber = rowNumber;
        buildingData.propertiesWithRelations.push(propertyWithRelations);
      } catch (error) {
        skippedRecords++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.parsingErrors?.push({
          type: "parsing",
          message: `Error procesando fila ${rowNumber}: ${errorMsg}`,
          context: `Fila ${rowNumber}`,
          rowNumber,
          severity: "error",
        });
      }
    });

    console.log(
      `[Parse Excel] Completado: ${rows.length} procesados, ${skippedRecords} omitidos, ${buildingsMap.size} edificios`
    );

    return result;
  } catch (error) {
    console.error(`[Parse Excel] Error fatal:`, error);
    throw error;
  }
};
