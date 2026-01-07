/**
 * Parser CSV Mejorado con Soporte de Versiones
 *
 * Este parser:
 * 1. Detecta automáticamente la versión del CSV
 * 2. Valida la estructura antes de procesar
 * 3. Mapea cada versión al formato estándar interno
 * 4. Captura errores con número de fila
 */

import csv from "csv-parser";
import fs from "fs";
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
  CSV_VERSIONS,
} from "../types/csvVersions";
import { mapRowToStandard, RawCSVRow } from "./versionMappers";

/**
 * Lee los headers del CSV leyendo la primera línea
 */
function readCSVHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, "latin1");
    let buffer = "";
    let headersRead = false;

    readStream.on("data", (chunk: string | Buffer) => {
      if (headersRead) {
        readStream.destroy();
        return;
      }

      const chunkStr =
        typeof chunk === "string" ? chunk : chunk.toString("latin1");
      buffer += chunkStr;
      const newlineIndex = buffer.indexOf("\n");

      if (newlineIndex !== -1) {
        headersRead = true;
        const firstLine = buffer.substring(0, newlineIndex);
        const headers = firstLine
          .split(";")
          .map((h) => h.trim().replace(/^"|"$/g, "")); // Remover comillas si existen
        readStream.destroy();
        resolve(headers);
      }
    });

    readStream.on("end", () => {
      if (!headersRead) {
        // Si no hay newline, toda la primera línea es el header
        const headers = buffer
          .split(";")
          .map((h) => h.trim().replace(/^"|"$/g, ""));
        resolve(headers);
      }
    });

    readStream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Parsea el CSV con soporte de versiones y validación mejorada
 */
export const parseInmovillaCSV = (filePath: string): Promise<ParsedCSVData> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Leer headers y detectar versión
      const headers = await readCSVHeaders(filePath);
      const versionDetection = detectCSVVersion(headers);

      console.log(
        `[Parse CSV] Versión detectada: ${
          versionDetection.version
        } (confianza: ${Math.round(versionDetection.confidence * 100)}%)`
      );

      // 2. Validar estructura si se detectó una versión conocida
      if (versionDetection.definition) {
        const validation = validateCSVStructure(
          headers,
          versionDetection.definition
        );

        if (!validation.isValid) {
          const errorMessage =
            `El archivo CSV no tiene la estructura correcta para la versión ${versionDetection.version}.\n` +
            `Columnas requeridas faltantes: ${validation.missingRequired.join(
              ", "
            )}\n` +
            `Columnas extra detectadas: ${validation.extraColumns.join(", ")}`;

          console.error(`[Parse CSV] ${errorMessage}`);

          // Crear error de validación
          const validationError: ImportError = {
            type: "validation",
            message: errorMessage,
            context: `Versión detectada: ${versionDetection.version}`,
            severity: "error", // ERROR: Estructura incorrecta impide procesamiento
          };

          reject(new Error(errorMessage));
          return;
        }

        // Advertir sobre columnas faltantes opcionales o extra
        if (validation.missingOptional.length > 0) {
          console.warn(
            `[Parse CSV] Columnas opcionales faltantes: ${validation.missingOptional.join(
              ", "
            )}`
          );
        }
        if (validation.extraColumns.length > 0) {
          console.warn(
            `[Parse CSV] Columnas extra detectadas (serán ignoradas): ${validation.extraColumns.join(
              ", "
            )}`
          );
        }
      } else {
        // Versión desconocida - advertir pero continuar
        console.warn(
          `[Parse CSV] No se pudo detectar una versión conocida del CSV. Intentando procesar como v1.`
        );
        console.warn(`[Parse CSV] Columnas encontradas: ${headers.join(", ")}`);
      }

      // 3. Procesar el CSV
      const result: ParsedCSVData = {
        buildingsMap: new Map<BuildingKey, BuildingProcessingUnit>(),
        streets: new Set<string>(),
        totalRecords: 0,
        csvVersion: versionDetection.version,
        parsingErrors: [],
      };

      const { buildingsMap, streets, totalRecords } = result;
      let skippedRecords = 0;
      let processedRecords = 0;
      const csvVersion: CSVVersion = versionDetection.version;

      fs.createReadStream(filePath, "latin1")
        .pipe(
          csv({
            separator: ";",
            mapHeaders: ({ header }) => header.trim(),
            mapValues: ({ value }) => (value === "" ? null : value.trim()),
          })
        )
        .on("data", (data: RawCSVRow) => {
          processedRecords++;
          result.totalRecords = processedRecords;
          const rowNumber = processedRecords + 1; // +1 porque la fila 1 es el header

          try {
            // 4. Mapear fila a formato estándar según versión
            const record: InmovillaCSVRecord = mapRowToStandard(
              data,
              csvVersion
            );

            // 5. Mapear a DTOs internos
            const building: BuilindingInCSVDTO = mapBuilding(record);
            const property: PropertyInCSVDTO = mapProperty(record);
            const client: ClientInCSVDTO = mapClient(record);
            const captador: CaptadorInCSVDTO = mapCaptador(record);

            const propertyWithRelations: PropertyWithRelations = {
              property,
              client,
              captador,
              originalRecord: record, // Guardar record original para rastrear columnas en errores
            };

            // 6. Validación mejorada de edificio
            const isValidBuilding =
              building.number !== null &&
              !isNaN(building.number) &&
              typeof building.number === "number" &&
              building.street &&
              building.street.trim().length > 1;

            // 7. Validación mejorada de propiedad
            const isValidProperty =
              property.inmovillaCode !== null &&
              !isNaN(property.inmovillaCode) &&
              property.inmovillaCode > 0;

            // 8. Omitir registro si no es válido y registrar error
            if (!isValidBuilding || !isValidProperty) {
              skippedRecords++;
              const reasons: string[] = [];
              if (!isValidBuilding) {
                reasons.push(
                  `edificio inválido (calle: "${building.street}", número: ${building.number})`
                );
                const error: ImportError = {
                  type: "validation",
                  message: `Edificio inválido en fila ${rowNumber}: calle "${building.street}", número ${building.number}`,
                  context: `Fila ${rowNumber}`,
                  rowNumber,
                  severity: "error", // ERROR: Edificio inválido impide procesar propiedades
                };
                result.parsingErrors?.push(error);
              }
              if (!isValidProperty) {
                reasons.push(
                  `propiedad inválida (código: ${property.inmovillaCode})`
                );
                const error: ImportError = {
                  type: "validation",
                  message: `Propiedad inválida en fila ${rowNumber}: código ${property.inmovillaCode}`,
                  context: `Fila ${rowNumber}`,
                  rowNumber,
                  severity: "error", // ERROR: Propiedad inválida impide procesamiento
                };
                result.parsingErrors?.push(error);
              }
              if (processedRecords % 100 === 0 || skippedRecords <= 5) {
                console.warn(
                  `[Parse CSV] Registro ${rowNumber} omitido: ${reasons.join(
                    ", "
                  )}`
                );
              }
              return;
            }

            const buildingKey = getBuildingKey(building);
            streets.add(building.street);

            // 9. Agregar el edificio al Mapa
            if (!buildingsMap.has(buildingKey)) {
              buildingsMap.set(buildingKey, {
                building,
                propertiesWithRelations: [],
                firstRowNumber: rowNumber, // Guardar número de fila de la primera propiedad
              });
            }

            // 10. Agregar la puerta (y sus relaciones) al edificio en el mapa
            const buildingData = buildingsMap.get(buildingKey)!;

            // 11. Validar duplicados de propiedades por código Inmovilla
            const isDuplicate = buildingData.propertiesWithRelations.some(
              (p) => p.property.inmovillaCode === property.inmovillaCode
            );

            if (isDuplicate) {
              skippedRecords++;
              const error: ImportError = {
                type: "validation",
                message: `Propiedad duplicada en fila ${rowNumber}: código ${property.inmovillaCode} (ya procesada en este archivo)`,
                context: `Fila ${rowNumber}, Edificio: ${buildingKey}`,
                rowNumber,
                severity: "warning", // ADVERTENCIA: Duplicado en CSV, no impide procesamiento
              };
              result.parsingErrors?.push(error);
              console.warn(
                `[Parse CSV] Propiedad duplicada omitida: código ${property.inmovillaCode} en edificio ${buildingKey} (fila ${rowNumber})`
              );
              return;
            }

            // Agregar número de fila a la propiedad
            propertyWithRelations.rowNumber = rowNumber;
            buildingData.propertiesWithRelations.push(propertyWithRelations);
          } catch (error) {
            skippedRecords++;
            const errorMsg =
              error instanceof Error ? error.message : String(error);

            const parsingError: ImportError = {
              type: "parsing",
              message: `Error procesando fila ${rowNumber}: ${errorMsg}`,
              context: `Fila ${rowNumber}`,
              rowNumber,
              severity: "error", // ERROR: Excepción durante parsing impide procesar fila
            };

            result.parsingErrors?.push(parsingError);
            console.error(
              `[Parse CSV] Error procesando registro ${rowNumber}:`,
              errorMsg
            );
          }
        })
        .on("end", () => {
          console.log(
            `[Parse CSV] Parseo completado: ${processedRecords} registros procesados, ${skippedRecords} omitidos, ${buildingsMap.size} edificios únicos`
          );
          if (result.parsingErrors && result.parsingErrors.length > 0) {
            console.warn(
              `[Parse CSV] ${result.parsingErrors.length} errores de parsing detectados`
            );
          }
          resolve(result);
        })
        .on("error", (error) => {
          console.error(`[Parse CSV] Error fatal al leer archivo:`, error);
          reject(error);
        });
    } catch (error) {
      console.error(`[Parse CSV] Error en validación inicial:`, error);
      reject(error);
    }
  });
};
