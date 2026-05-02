import { PrismaClient } from "../../../../generated/prisma";
import { WordPressImportResultDTO } from "../types";

interface RsoEdificio {
  id: string;
  calle: string;
  numero: string;
  codigo_postal?: string;
  ciudad?: string;
  provincia?: string;
  zona?: string;
  notas?: string;
}

interface RsoPuerta {
  id: string;
  id_edificio: string;
  codigo_inmovilla?: string;
  numero_puerta?: string;
  planta?: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono_fijo?: string;
  telefono_movil?: string;
  precio_venta?: string;
  precio_alquiler?: string;
  precio_valoracion?: string;
  estado?: string;
  ocupado_por?: string;
  captado_por?: string;
  is_valorado?: string;
  is_presidente?: string;
  informador?: string;
  vendido_alquilado_nosotros?: string;
  sucursal?: string;
  aviso_importante?: string;
  observacion_rso?: string;
  observacion_cliente?: string;
  no_molestar?: string;
  no_felpudo?: string;
  no_timbre?: string;
  no_contador?: string;
}

interface RsoInquilino {
  id: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  observaciones?: string;
}

interface RsoAsignado {
  id: string;
  id_puerta: string;
  id_inquilino: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: string;
}

interface RsoSeguimiento {
  id: string;
  id_puerta: string;
  tipo?: string;
  subtipo?: string;
  nota?: string;
  fecha?: string;
  nombre_empleado?: string;
  id_empleado?: string;
  done?: string;
}

interface RsoJson {
  wprm_rso_edificio?: RsoEdificio[];
  wprm_rso_puerta?: RsoPuerta[];
  wprm_rso_inquilino?: RsoInquilino[];
  wprm_rso_asignado?: RsoAsignado[];
  wprm_rso_seguimiento?: RsoSeguimiento[];
}

export class WordPressService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async importFromJson(data: RsoJson): Promise<WordPressImportResultDTO> {
    console.log('🚀 Starting WordPress import processing...');
    const result: WordPressImportResultDTO = {
      propertiesProcessed: 0,
      propertiesImported: 0,
      propertiesUpdated: 0,
      buildingsCreated: 0,
      peopleImported: 0,
      followUpsCreated: 0,
      errors: [],
    };

    // Validate it's the RSO format
    if (!data.wprm_rso_edificio && !data.wprm_rso_puerta) {
      result.errors.push(
        "Formato de JSON incorrecto. Se esperaba migracion_rso.json con las tablas wprm_rso_*."
      );
      return result;
    }

    // Map: RSO edificio id → inmuhub Building id
    const buildingIdMap = new Map<string, number>();

    // ─── 1. EDIFICIOS → Building ──────────────────────────────────────────
    console.log(`🏢 Processing ${data.wprm_rso_edificio?.length || 0} buildings...`);
    for (const edificio of data.wprm_rso_edificio ?? []) {
      try {
        const street = (edificio.calle ?? "SIN CALLE").trim();
        const number = parseInt(edificio.numero ?? "0") || 0;

        const existing = await this.prisma.building.findFirst({
          where: { street, number },
        });

        if (existing) {
          buildingIdMap.set(edificio.id, existing.id);
        } else {
          const created = await this.prisma.building.create({
            data: { street, number },
          });
          buildingIdMap.set(edificio.id, created.id);
          result.buildingsCreated++;
        }
      } catch (e: any) {
        result.errors.push(`Edificio ${edificio.id}: ${e.message}`);
      }
    }

    // If no buildings were in the file, create a fallback one
    let fallbackBuildingId: number | null = null;
    if (buildingIdMap.size === 0) {
      const fallback = await this.prisma.building.findFirst({
        where: { street: "MIGRACION WORDPRESS", number: 0 },
      });
      if (fallback) {
        fallbackBuildingId = fallback.id;
      } else {
        const created = await this.prisma.building.create({
          data: { street: "MIGRACION WORDPRESS", number: 0 },
        });
        fallbackBuildingId = created.id;
        result.buildingsCreated++;
      }
    }

    // ─── 2. PERSONAS (INQUILINOS) → Person ────────────────────────────────
    console.log(`👥 Processing ${data.wprm_rso_inquilino?.length || 0} people...`);
    const personIdMap = new Map<string, number>();

    for (const inquilino of data.wprm_rso_inquilino ?? []) {
      try {
        if (!inquilino.nombre && !inquilino.apellidos) continue;

        const firstName = (inquilino.nombre ?? "").trim() || "Sin nombre";
        const lastName = (inquilino.apellidos ?? "").trim() || "Sin apellido";
        const email = inquilino.email?.trim() || null;

        let existing = email
          ? await this.prisma.person.findFirst({ where: { email } })
          : null;

        if (!existing) {
          existing = await this.prisma.person.findFirst({
            where: { firstName, lastName },
          });
        }

        if (existing) {
          personIdMap.set(inquilino.id, existing.id);
        } else {
          const created = await this.prisma.person.create({
            data: {
              firstName,
              lastName,
              email: email ?? undefined,
            },
          });
          personIdMap.set(inquilino.id, created.id);
          result.peopleImported++;

          if (inquilino.telefono?.trim()) {
            await this.prisma.personPhone.create({
              data: {
                personId: created.id,
                phone: inquilino.telefono.trim(),
                type: "Mobile" as any,
              },
            });
          }
        }
      } catch (e: any) {
        result.errors.push(`Persona ${inquilino.id}: ${e.message}`);
      }
    }

    // ─── 3. PUERTAS → Property ────────────────────────────────────────────
    console.log(`🏠 Processing ${data.wprm_rso_puerta?.length || 0} properties...`);
    const propertyIdMap = new Map<string, number>(); // rsoId → inmuhubId

    for (const puerta of data.wprm_rso_puerta ?? []) {
      result.propertiesProcessed++;
      try {
        const buildingId = buildingIdMap.get(puerta.id_edificio) ?? fallbackBuildingId;
        
        if (!buildingId) {
          result.errors.push(`Puerta ${puerta.id}: No se pudo encontrar edificio asociado (ID RSO: ${puerta.id_edificio})`);
          continue;
        }

        const inmovillaCodeRaw = parseInt(puerta.codigo_inmovilla ?? "0") || parseInt(puerta.id) || 0;
        const inmovillaCode = isNaN(inmovillaCodeRaw) ? 0 : inmovillaCodeRaw;
        
        const number = (puerta.numero_puerta ?? puerta.id ?? "0").toString().trim();
        const floor = parseInt(puerta.planta ?? "0") || 0;

        const statusMap: Record<string, string> = {
          venta: "noticia_venta",
          alquiler: "noticia_alquiler",
          noticia_venta: "noticia_venta",
          noticia_alquiler: "noticia_alquiler",
          antiguo_cliente: "antiguo_cliente",
        };
        const status = (statusMap[puerta.estado?.toLowerCase() ?? ""] ?? "sin_estado") as any;

        const existing = await this.prisma.property.findFirst({
          where: { inmovillaCode },
        });

        const propertyData = {
          salePrice: puerta.precio_venta ? parseFloat(puerta.precio_venta) : undefined,
          rentalPrice: puerta.precio_alquiler ? parseFloat(puerta.precio_alquiler) : undefined,
          appraisalPrice: puerta.precio_valoracion ? parseFloat(puerta.precio_valoracion) : undefined,
          status,
          occupiedBy: puerta.ocupado_por ?? undefined,
          importantNotice: puerta.aviso_importante ?? undefined,
          rso_comment: puerta.observacion_rso ?? undefined,
          noDisturb: puerta.no_molestar === "1",
          noDoormat: puerta.no_felpudo === "1",
          noBell: puerta.no_timbre === "1",
          noCounter: puerta.no_contador === "1",
          soldRentedUs: puerta.vendido_alquilado_nosotros === "1",
          branch: puerta.sucursal ?? undefined,
        };

        if (existing) {
          await this.prisma.property.update({
            where: { id: existing.id },
            data: propertyData,
          });
          propertyIdMap.set(puerta.id, existing.id);
          result.propertiesUpdated++;
        } else {
          const created = await this.prisma.property.create({
            data: {
              ...propertyData,
              inmovillaCode,
              number,
              floor,
              buildingId,
              isPresident: puerta.is_presidente === "1",
              isInformer: puerta.informador === "1",
            },
          });
          propertyIdMap.set(puerta.id, created.id);
          result.propertiesImported++;
        }
      } catch (e: any) {
        result.errors.push(`Puerta ${puerta.id}: ${e.message}`);
      }
    }

    // ─── 4. ASIGNACIONES (INQUILINOS A PUERTAS) ──────────────────────────
    for (const asignado of data.wprm_rso_asignado ?? []) {
      try {
        const propertyId = propertyIdMap.get(asignado.id_puerta);
        const personId = personIdMap.get(asignado.id_inquilino);

        if (propertyId && personId) {
          // Si está activo, lo ponemos como tenantId principal de la propiedad
          if (asignado.activo === "1" || !asignado.fecha_fin) {
            await this.prisma.property.update({
              where: { id: propertyId },
              data: { tenantId: personId },
            });
          }
        }
      } catch (e: any) {
        result.errors.push(`Asignación ${asignado.id}: ${e.message}`);
      }
    }

    // ─── 5. SEGUIMIENTOS → FollowUp ──────────────────────────────────────
    console.log(`📝 Processing ${data.wprm_rso_seguimiento?.length || 0} follow-ups...`);
    const systemUser = await this.prisma.user.findFirst();
    if (systemUser) {
      for (const seg of data.wprm_rso_seguimiento ?? []) {
        try {
          const propertyId = propertyIdMap.get(seg.id_puerta);
          if (!propertyId) continue;

          const executedDate = seg.fecha ? new Date(seg.fecha) : new Date();

          await this.prisma.followUp.create({
            data: {
              sellerId: systemUser.id,
              propertyId,
              wasContacted: seg.done === "1",
              contactType: seg.tipo ?? null,
              observationType: seg.subtipo ?? null,
              comment: seg.nota ?? null,
              executedDate,
            },
          });
          result.followUpsCreated++;
        } catch (e: any) {
          result.errors.push(`Seguimiento ${seg.id}: ${e.message}`);
        }
      }
    }

    console.log('✅ WordPress import finished successfully!');
    return result;
  }


  //stats
  async stats() {
    //building count
    const buildingCount = await this.prisma.building.count();
    //property count
    const propertyCount = await this.prisma.property.count();
    //person count
    const personCount = await this.prisma.person.count();
    //followUp count
    const followUpCount = await this.prisma.followUp.count();

    return {
     totalBuildings: buildingCount,
     totalProperties: propertyCount,
     totalPersons: personCount,
     totalFollowUps: followUpCount
    };
  }
}
