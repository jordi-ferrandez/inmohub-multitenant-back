import { prisma } from "@core/lib";
import {
  InmovillaCSVRecord,
  ImportDTO,
  BuilindingInCSVDTO,
  ParsedCSVData,
  BuildingProcessingUnit,
  PropertyWithRelations,
  ImportError,
} from "../types";
import { BatchProcessor } from "@core/utils/BatchProcessor";
import { Person, PhoneType, Property } from "./../../../../generated/prisma";

export class InmovillaService {
  async importFromCSV(parsedCSVData: ParsedCSVData): Promise<ImportDTO> {
    const startTime = Date.now();
    const parseTime = Date.now();
    const response: ImportDTO = {
      totalRecords: parsedCSVData.totalRecords,
      buildingsCreated: 0,
      buildingsExisting: 0,
      propertiesCreated: 0,
      propertiesExisting: 0,
      clientsCreated: 0,
      clientsExisting: 0,
      ownershipsCreated: 0,
      errors: parsedCSVData.parsingErrors || [], // Incluir errores de parsing desde el inicio
    };

    // Log de versión detectada
    if (parsedCSVData.csvVersion) {
      console.log(
        `[Import CSV] Procesando CSV versión: ${parsedCSVData.csvVersion}`
      );
    }

    // Procesa los edificios en paralelo
    const buildingEntries = Array.from(parsedCSVData.buildingsMap.entries());
    const parseTimeMs = Date.now() - parseTime;
    console.log(
      `[Import CSV] Parseo completado en ${parseTimeMs}ms - ${parsedCSVData.totalRecords} registros, ${buildingEntries.length} edificios únicos`
    );
    console.log(
      `[Import CSV] Iniciando procesamiento de ${buildingEntries.length} edificios en lotes de 10`
    );

    const buildingStartTime = Date.now();
    let processedBuildings = 0;

    const buildingProcessingResults =
      await BatchProcessor.processInBatchesWithErrorHandling<
        [string, BuildingProcessingUnit],
        { buildingCreated: boolean; buildingExisting: boolean }
      >(
        buildingEntries,
        10,
        async ([buildingKey, buildingUnit]) => {
          const result = await this.processBuilding(buildingUnit, response);
          processedBuildings++;
          if (
            processedBuildings % 10 === 0 ||
            processedBuildings === buildingEntries.length
          ) {
            console.log(
              `[Import CSV] Progreso edificios: ${processedBuildings}/${
                buildingEntries.length
              } (${Math.round(
                (processedBuildings / buildingEntries.length) * 100
              )}%)`
            );
          }
          return result;
        },
        ([key, buildingUnit], err) => {
          const msg = err instanceof Error ? err.message : String(err);
          const rowNumber = buildingUnit.firstRowNumber;
          const error: ImportError = {
            type: "building",
            message: this.getDescriptiveErrorMessage(err, "edificio"),
            context: `${key}${rowNumber ? ` (fila ${rowNumber})` : ""}`,
            rowNumber,
            severity: "error", // ERROR: Error al procesar edificio impide procesar propiedades
          };
          response.errors.push(error);
          console.error(
            `[Import CSV] Error procesando edificio ${key}${rowNumber ? ` (fila ${rowNumber})` : ""}:`,
            msg
          );
        }
      );

    const buildingTimeMs = Date.now() - buildingStartTime;
    response.buildingsCreated = buildingProcessingResults.filter(
      (r) => r?.buildingCreated
    ).length;
    response.buildingsExisting = buildingProcessingResults.filter(
      (r) => r?.buildingExisting
    ).length;

    const endTime = Date.now();
    response.processingTimeMs = endTime - startTime;
    response.csvVersion = parsedCSVData.csvVersion; // Incluir versión en respuesta

    console.log(
      `[Import CSV] Procesamiento completado en ${response.processingTimeMs}ms (parseo: ${parseTimeMs}ms, procesamiento: ${buildingTimeMs}ms)`
    );
    console.log(`[Import CSV] Resumen final:`);
    if (response.csvVersion) {
      console.log(`  - Versión CSV: ${response.csvVersion}`);
    }
    console.log(
      `  - Edificios: ${response.buildingsCreated} creados, ${response.buildingsExisting} existentes`
    );
    console.log(
      `  - Propiedades: ${response.propertiesCreated} creadas, ${response.propertiesExisting} existentes`
    );
    console.log(
      `  - Clientes: ${response.clientsCreated} creados, ${response.clientsExisting} existentes`
    );
    console.log(
      `  - Errores: ${response.errors.length} (${this.getErrorCountByType(
        response.errors
      )})`
    );

    return response;
  }

  /**
   * Detecta qué columna del CSV causó el error basándose en el mensaje y el record original
   */
  private detectColumnNameFromError(
    error: unknown,
    originalRecord?: InmovillaCSVRecord
  ): string | undefined {
    if (!originalRecord || !(error instanceof Error)) {
      return undefined;
    }

    const message = error.message.toLowerCase();
    const originalMessage = error.message;

    // Si el error menciona "número" o "number" o "invalid", buscar campos numéricos con valores inválidos
    if (message.includes("número") || message.includes("number") || message.includes("invalid") || message.includes("inválido")) {
      // Campos numéricos que pueden causar errores en propiedades
      const numericColumns: Array<{ name: string; key: keyof InmovillaCSVRecord }> = [
        { name: "Codigo", key: "Codigo" },
        { name: "Calle prop Planta", key: "Calle prop Planta" },
        { name: "Valoracion", key: "Valoracion" },
        { name: "Sucursal Captador", key: "Sucursal Captador" },
      ];

      // Altura solo existe en v3, verificar si existe en el record
      if ("Altura" in originalRecord) {
        numericColumns.push({ name: "Altura", key: "Altura" as keyof InmovillaCSVRecord });
      }
      // Sucursal solo existe en v1
      if ("Sucursal" in originalRecord) {
        numericColumns.push({ name: "Sucursal", key: "Sucursal" as keyof InmovillaCSVRecord });
      }

      // Verificar cada columna numérica para encontrar valores inválidos
      for (const col of numericColumns) {
        const value = originalRecord[col.key];
        
        // Si el valor es null, undefined o string vacío, podría ser el problema
        if (value === null || value === undefined || value === "") {
          continue; // Estos son valores válidos para campos opcionales
        }

        // Si es número y es NaN, definitivamente es el problema
        if (typeof value === "number" && isNaN(value)) {
          return col.name;
        }

        // Si es string pero no se puede convertir a número, es el problema
        if (typeof value === "string" && value.trim() !== "" && isNaN(Number(value))) {
          return col.name;
        }
      }

      // Si no encontramos un valor claramente inválido, pero el error es sobre números,
      // verificar campos que deberían ser números pero podrían tener problemas
      // Priorizar Codigo y floor (Calle prop Planta/Altura) ya que son los más comunes
      if (message.includes("floor") || message.includes("planta") || message.includes("altura")) {
        if ("Calle prop Planta" in originalRecord && originalRecord["Calle prop Planta"] !== null && originalRecord["Calle prop Planta"] !== undefined) {
          return "Calle prop Planta";
        }
        if ("Altura" in originalRecord && originalRecord["Altura"] !== null && originalRecord["Altura"] !== undefined) {
          return "Altura";
        }
      }

      // Por defecto, si es un error numérico y no encontramos el campo específico,
      // retornar "Codigo" ya que es el campo numérico más crítico
      return "Codigo";
    }

    // Mapeo de campos DTO a columnas CSV para otros tipos de errores
    const fieldToColumnMap: Record<string, string[]> = {
      inmovillaCode: ["Codigo"],
      floor: ["Calle prop Planta", "Altura"],
      appraisalPrice: ["Valoracion"],
      number: ["Puerta"],
      branch: ["Sucursal Captador", "Sucursal"],
    };

    // Buscar en el mensaje referencias a campos específicos
    for (const [field, columns] of Object.entries(fieldToColumnMap)) {
      if (message.includes(field) || originalMessage.includes(field)) {
        // Buscar qué columna tiene un valor inválido
        for (const col of columns) {
          const value = originalRecord[col as keyof InmovillaCSVRecord];
          if (value === null || value === undefined || value === "" || (typeof value === "number" && isNaN(value))) {
            return col;
          }
        }
        // Si no encontramos un valor inválido, retornar la primera columna posible
        return columns[0];
      }
    }

    return undefined;
  }

  private getDescriptiveErrorMessage(
    error: unknown,
    entityType: string,
    columnName?: string
  ): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const originalMessage = error.message;

      // Errores de validación de datos
      if (message.includes("invalid") || message.includes("inválido")) {
        // Intentar extraer más detalles del mensaje original
        if (message.includes("número") || message.includes("number")) {
          const columnInfo = columnName ? ` en la columna '${columnName}'` : "";
          return `El valor debe ser un número válido${columnInfo}. Verifique que el campo contenga solo dígitos y no esté vacío.`;
        }
        if (message.includes("email")) {
          return `El formato del email es inválido. Debe tener el formato: usuario@dominio.com`;
        }
        if (message.includes("calle") || message.includes("street")) {
          return `La calle debe tener al menos 2 caracteres y no estar vacía.`;
        }
        return `Datos inválidos en ${entityType}. Verifique que todos los campos requeridos estén presentes y tengan el formato correcto.`;
      }

      // Errores de base de datos - Unique constraint
      if (
        message.includes("unique constraint") ||
        message.includes("duplicate") ||
        message.includes("duplicado")
      ) {
        return `Ya existe un ${entityType} con estos datos en el sistema. El registro fue omitido para evitar duplicados.`;
      }

      // Errores de base de datos - Foreign key
      if (message.includes("foreign key") || message.includes("constraint")) {
        return `Error de integridad referencial: Los datos relacionados no existen en el sistema. Verifique que el edificio, propiedad o persona relacionada exista.`;
      }

      // Errores de campos requeridos
      if (message.includes("null") || message.includes("required") || message.includes("requerido")) {
        if (message.includes("email")) {
          return `Error con el email proporcionado. Si se proporciona un email, debe tener un formato válido (ejemplo: usuario@dominio.com).`;
        }
        if (message.includes("number") || message.includes("número")) {
          return `El número del edificio es obligatorio. Verifique que la columna 'Calle Prop Num' contenga un valor numérico válido.`;
        }
        if (message.includes("street") || message.includes("calle")) {
          return `La calle es obligatoria. Verifique que la columna 'Calle Prop' contenga un valor válido.`;
        }
        return `Campo requerido faltante en ${entityType}. Verifique que todos los campos obligatorios estén presentes en el CSV.`;
      }

      // Errores de formato de email
      if (message.includes("email") && (message.includes("formato") || message.includes("format"))) {
        return `El formato del email es inválido. Debe tener el formato: usuario@dominio.com (ejemplo: juan.perez@email.com)`;
      }

      // Errores de tipo de dato
      if (message.includes("must be") || message.includes("debe ser") || message.includes("expected")) {
        const columnInfo = columnName ? ` en la columna '${columnName}'` : "";
        if (message.includes("number") || message.includes("número")) {
          return `El valor debe ser un número${columnInfo}. Verifique que no contenga letras o caracteres especiales.`;
        }
        if (message.includes("string") || message.includes("texto")) {
          return `El valor debe ser texto${columnInfo}. Verifique el formato del campo.`;
        }
      }

      // Errores de conexión
      if (message.includes("connection") || message.includes("timeout") || message.includes("conexión")) {
        return `Error de conexión con la base de datos. Verifique su conexión a internet e intente nuevamente. Si el problema persiste, contacte al administrador del sistema.`;
      }

      // Errores de rango de valores
      if (message.includes("greater than") || message.includes("mayor que") || message.includes("debe ser mayor")) {
        return `El valor debe ser mayor que 0. Verifique que el campo contenga un número positivo válido.`;
      }

      // Error genérico con contexto y sugerencia
      return `Error al procesar ${entityType}: ${originalMessage}. Revise los datos en el CSV y verifique que cumplan con el formato esperado.`;
    }

    return `Error desconocido al procesar ${entityType}. Revise los datos y verifique que cumplan con el formato esperado.`;
  }

  private getErrorCountByType(errors: ImportError[]): string {
    const counts: Record<string, number> = {};
    errors.forEach((err) => {
      counts[err.type] = (counts[err.type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ");
  }
  /**
   * @deprecated
   * @param buildings
   * @param response
   * @param batchSize
   * @returns
   */
  private async buildingBatchProcessing(
    buildings: [string, BuildingProcessingUnit][],
    response: ImportDTO,
    batchSize: number
  ): Promise<any> {
    for (let i = 0; i < buildings.length; i += batchSize) {
      const start = i;
      const end =
        start + batchSize > buildings.length
          ? buildings.length
          : start + batchSize;

      const result = await Promise.all(
        buildings
          .slice(start, end)
          .map(async ([buildingKey, buildingProcessingUnit]) => {
            try {
              const { buildingCreated } = await this.processBuilding(
                buildingProcessingUnit,
                response
              );
              if (buildingCreated) response.buildingsCreated++;
              return buildingCreated;
            } catch (error: unknown) {
              const msg =
                error instanceof Error ? error.message : String(error);
              const importError: ImportError = {
                type: "building",
                message: this.getDescriptiveErrorMessage(error, "edificio"),
                context: buildingKey,
                severity: "error", // ERROR: Error al procesar edificio impide procesar propiedades
              };
              response.errors.push(importError);
              console.error(
                `[Import CSV] Error procesando edificio ${buildingKey}:`,
                msg
              );
              return null;
            }
          })
      );
      return result;
    }
  }

  private async processBuilding(
    buildingUnit: BuildingProcessingUnit,
    response: ImportDTO
  ): Promise<{ buildingCreated: boolean; buildingExisting: boolean }> {
    let buildingCreated = false;
    let buildingExisting = false;
    const building = buildingUnit.building;

    if (building.number === null || isNaN(building.number)) {
      throw new Error(
        `Número de edificio inválido: "${building.number}". El número debe ser un valor numérico válido.`
      );
    }

    if (!building.street || building.street.trim().length < 2) {
      throw new Error(
        `Calle de edificio inválida: "${building.street}". La calle debe tener al menos 2 caracteres.`
      );
    }
    const data = {
      street: building.street,
      number: building.number,
      block: building.block,
      stair: building.stair,
    };

    let dbBuilding = await prisma.building.findFirst({
      where: { ...data },
    });

    if (!dbBuilding) {
      dbBuilding = await prisma.building.create({
        data,
      });
      buildingCreated = true;
    } else {
      buildingExisting = true;
    }

    await BatchProcessor.processInBatchesWithErrorHandling<
      PropertyWithRelations,
      void
    >(
      buildingUnit.propertiesWithRelations,
      15,
      async (propertyUnit) =>
        this.processProperty(dbBuilding.id, propertyUnit, response),
      (propertyUnit, err) => {
        const code = propertyUnit.property.inmovillaCode;
        const rowNumber = propertyUnit.rowNumber;
        const msg = err instanceof Error ? err.message : String(err);
        const columnName = this.detectColumnNameFromError(err, propertyUnit.originalRecord);
        // Determinar severity basado en el tipo de error
        const errorMessage = this.getDescriptiveErrorMessage(err, `propiedad ${code}`, columnName);
        const isDuplicateError = err instanceof Error && (
          err.message.toLowerCase().includes("unique constraint") ||
          err.message.toLowerCase().includes("duplicate") ||
          err.message.toLowerCase().includes("duplicado")
        );
        
        const error: ImportError = {
          type: "property",
          message: errorMessage,
          context: `Código Inmovilla: ${code}, Edificio: ${buildingUnit.building.street} ${buildingUnit.building.number}${rowNumber ? `, Fila: ${rowNumber}` : ""}${columnName ? `, Columna CSV: ${columnName}` : ""}`,
          rowNumber,
          columnName,
          severity: isDuplicateError ? "warning" : "error", // ADVERTENCIA si es duplicado, ERROR si es otro problema
        };
        response.errors.push(error);
        console.error(
          `[Import CSV] Error procesando propiedad ${code}${rowNumber ? ` (fila ${rowNumber})` : ""}${columnName ? `, columna: ${columnName}` : ""}:`,
          msg
        );
      }
    );

    return { buildingCreated, buildingExisting };
  }

  private async processProperty(
    buildingId: number,
    propertyWithRelations: PropertyWithRelations,
    response: ImportDTO
  ): Promise<void> {
    const { property, client, captador } = propertyWithRelations;

    let dbProperty = await prisma.property.findFirst({
      where: {
        OR: [
          { inmovillaCode: property.inmovillaCode },
          {
            AND: [
              { buildingId: buildingId },
              { floor: property.floor },
              { number: property.number },
            ],
          },
        ],
      },
    });

    if (dbProperty) {
      response.propertiesExisting++;
      // Agregar mensaje INFO cuando la propiedad ya existe (re-importación normal)
      const rowNumber = propertyWithRelations.rowNumber;
      const infoMessage: ImportError = {
        type: "info",
        message: `Propiedad ${property.inmovillaCode} ya existe en el sistema. Se omitió para evitar duplicados.`,
        context: `Código Inmovilla: ${property.inmovillaCode}, Edificio ID: ${buildingId}${rowNumber ? `, Fila: ${rowNumber}` : ""}`,
        rowNumber,
        severity: "info", // INFO: Re-importación normal, no es un error
      };
      response.errors.push(infoMessage);
      return;
    }

    dbProperty = await prisma.property.create({
      data: {
        buildingId: buildingId,
        number: property.number,
        inmovillaCode: property.inmovillaCode,
        floor: property.floor,
        appraisalPrice: property.appraisalPrice,
        branch: property.branch,
        importantNotice: property.importantNotice,
        occupiedBy: property.occupiedBy,
        rso_comment: property.rso_comment,
        soldRentedUs: property.soldRentedUs,
      },
    });
    response.propertiesCreated++;

    // Procesar cliente con manejo de errores para que no detenga el proceso
    try {
      await this.processClient(propertyWithRelations, dbProperty, response);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const rowNumber = propertyWithRelations.rowNumber;
      const importError: ImportError = {
        type: "client",
        message: this.getDescriptiveErrorMessage(
          error,
          `cliente de propiedad ${property.inmovillaCode}`
        ),
        context: `Propiedad ${property.inmovillaCode} - Cliente: ${propertyWithRelations.client.firstName} ${propertyWithRelations.client.lastName}${rowNumber ? `, Fila: ${rowNumber}` : ""}`,
        rowNumber,
        severity: "warning", // ADVERTENCIA: No impide procesar la propiedad
      };
      response.errors.push(importError);
      console.error(
        `[Import CSV] Error procesando cliente para propiedad ${property.inmovillaCode}${rowNumber ? ` (fila ${rowNumber})` : ""}:`,
        errorMsg
      );
      // Continuar con el procesamiento aunque falle el cliente
    }

    // Procesar captador con manejo de errores para que no detenga el proceso
    try {
      await this.processCaptador(propertyWithRelations, dbProperty);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const rowNumber = propertyWithRelations.rowNumber;
      const importError: ImportError = {
        type: "captador",
        message: this.getDescriptiveErrorMessage(
          error,
          `captador de propiedad ${property.inmovillaCode}`
        ),
        context: `Propiedad ${property.inmovillaCode} - Captador: ${propertyWithRelations.captador.firstName} ${propertyWithRelations.captador.lastName}${rowNumber ? `, Fila: ${rowNumber}` : ""}`,
        rowNumber,
        severity: "warning", // ADVERTENCIA: No impide procesar la propiedad
      };
      response.errors.push(importError);
      console.error(
        `[Import CSV] Error procesando captador para propiedad ${property.inmovillaCode}${rowNumber ? ` (fila ${rowNumber})` : ""}:`,
        errorMsg
      );
      // Continuar con el procesamiento aunque falle el captador
    }
  }

  private async processClient(
    propertyWithRelations: PropertyWithRelations,
    dbProperty: Property,
    response: ImportDTO
  ): Promise<Person | null> {
    const { client } = propertyWithRelations;

    try {
      // 1. Validar datos mínimos del cliente
      const hasName = client.firstName && client.lastName;
      const hasContact = client.email || client.telephone || client.mobilePhone;

      if (!hasName || !hasContact) {
        // Agregar advertencia cuando se omite cliente sin datos suficientes
        const rowNumber = propertyWithRelations.rowNumber;
        const warning: ImportError = {
          type: "client",
          message: `Cliente omitido para propiedad ${dbProperty.inmovillaCode}: falta nombre completo o información de contacto (email, teléfono o móvil)`,
          context: `Propiedad ${dbProperty.inmovillaCode}${rowNumber ? `, Fila: ${rowNumber}` : ""}`,
          rowNumber,
          severity: "warning", // ADVERTENCIA: No impide procesar la propiedad
        };
        response.errors.push(warning);
        console.warn(
          `[Import CSV] Cliente omitido para propiedad ${dbProperty.inmovillaCode}: falta nombre o contacto`
        );
        return null;
      }

      // 2. Validar y normalizar email (opcional)
      const emailValue =
        client.email &&
        typeof client.email === "string" &&
        client.email.trim() !== ""
          ? client.email.trim()
          : null;

      // Validar formato de email solo si se proporciona
      if (emailValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          throw new Error(
            `Email inválido: "${emailValue}". El formato debe ser válido (ejemplo: usuario@dominio.com).`
          );
        }
      }

      let dbPerson: Person | null = null;

      // Buscar persona: primero por email si existe, luego por nombre + teléfono
      if (emailValue) {
        // Buscar por email si está disponible
        dbPerson = await prisma.person.findUnique({
          where: { email: emailValue },
        });
      }

      // Si no se encontró por email, buscar por nombre + teléfono
      if (!dbPerson) {
        const phoneToSearch = client.mobilePhone || client.telephone;
        if (phoneToSearch && typeof phoneToSearch === "string") {
          const normalizedPhone = phoneToSearch.trim();
          // Buscar persona con mismo nombre y teléfono
          const personsWithName = await prisma.person.findMany({
            where: {
              firstName: client.firstName,
              lastName: client.lastName,
              phones: {
                some: {
                  phone: normalizedPhone,
                  deletedAt: null,
                },
              },
              deletedAt: null,
            },
            include: { phones: true },
            take: 1,
          });
          if (personsWithName.length > 0) {
            dbPerson = personsWithName[0];
          }
        }
      }

      // 3. Si no existe, crear la persona y sus teléfonos
      if (!dbPerson) {
        dbPerson = await prisma.person.create({
          data: {
            firstName: client.firstName,
            lastName: client.lastName,
            email: emailValue || null, // Email opcional
            phones: {
              create: [
                ...(client.telephone &&
                typeof client.telephone === "string" &&
                client.telephone.trim() !== ""
                  ? [{ phone: client.telephone.trim(), type: PhoneType.Home }]
                  : []),
                ...(client.mobilePhone &&
                typeof client.mobilePhone === "string" &&
                client.mobilePhone.trim() !== ""
                  ? [
                      {
                        phone: client.mobilePhone.trim(),
                        type: PhoneType.Mobile,
                      },
                    ]
                  : []),
              ],
            },
          },
          include: { phones: true },
        });
        response.clientsCreated++;
      } else {
        response.clientsExisting++;
      }

      // 4. Establecer relaciones según los valores del CSV
      if (!dbPerson) {
        return null;
      }

      const updates: any = {};
      updates.propertiesOwned = { connect: [{ id: dbProperty.id }] };

      if (client.isInformer) {
        updates.informerBuildings = {
          connect: [{ id: dbProperty.buildingId }],
        };
      }

      if (dbProperty.occupiedBy === "tenant") {
        updates.propertiesTenanted = { connect: [{ id: dbProperty.id }] };
      }

      if (Object.keys(updates).length > 0) {
        dbPerson = await prisma.person.update({
          where: { id: dbPerson.id },
          data: updates,
          include: { phones: true },
        });
      }

      return dbPerson;
    } catch (error) {
      // Log del error para debugging con más contexto
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `[Import CSV] Error procesando cliente para propiedad ${dbProperty.inmovillaCode}:`,
        errorMsg,
        `\nCliente: ${client.firstName} ${client.lastName}, Email: ${
          client.email || "N/A"
        }`
      );
      // Re-lanzar para que el caller lo maneje con mensaje mejorado
      if (error instanceof Error) {
        throw new Error(
          `Error al procesar cliente "${client.firstName} ${client.lastName}": ${error.message}`
        );
      }
      throw error;
    }
  }

  private async processCaptador(
    propertyWithRelations: PropertyWithRelations,
    dbProperty: Property
  ): Promise<void> {
    const { captador } = propertyWithRelations;
  }
}

/**!SECTION
 * 
 * 
 * 1. Error al usar {equals:null}. Recuerda que para mi este valor en mi base de datos nunca debe ser null porque es parte de la identificacion unica de mi edificio. Necesito eviatr procesar el registro del CSV bien sea durante el parse o en el servicio de modo que no trate ningun registro que no tenga un valor en number (entre otros criterios)
El tipo '{ equals: null; }' no se puede asignar al tipo 'number | IntFilter<"Building"> | undefined'.
  Los tipos de propiedad 'equals' no son compatibles.
    El tipo 'null' no se puede asignar al tipo 'number | FieldRef<"Building", "Int"> | undefined'.ts(2322)
(property) number?: number | Prisma.IntFilter<"Building"> | undefined

2. 
 */
