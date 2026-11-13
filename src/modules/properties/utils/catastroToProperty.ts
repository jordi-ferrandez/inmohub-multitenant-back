import { CatastroBico, CatastroRefConstruccion, CatastroRefRc } from "@modules/catastro/types";

export interface CatastroBuildingData {
  street: string;
  number: number;
  stair: string | null;
}

export interface MappedCatastro {
  building: CatastroBuildingData;
  property: Record<string, any>;
}

/**
 * Compone la referencia catastral completa (20 caracteres) a partir de sus partes.
 */
export function refCatastralFromRc(rc?: CatastroRefRc | null): string {
  if (!rc) return "";
  return `${rc.pc1 ?? ""}${rc.pc2 ?? ""}${rc.car ?? ""}${rc.cc1 ?? ""}${rc.cc2 ?? ""}`
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Normaliza números del Catastro ("912", "1.583", "3,654000") a número.
 */
function toNumber(value?: string | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Planta catastral a entero: "06" -> 6, "-4" -> -4, "Bajo"/"AT" -> 0.
 */
function floorToInt(value?: string | null): number {
  if (!value) return 0;
  const match = String(value).trim().match(/^(-?)0*(\d+)/);
  if (!match) return 0;
  const parsed = Number(`${match[1] ?? ""}${match[2]}`);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Número de portal a entero para Building.number: "1" -> 1, "12B" -> 12.
 */
function portalToInt(value?: string | null): number {
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/**
 * Traduce la respuesta del SGC (Consulta_DNPRC) a los campos de `Building` y `Property`.
 */
export function mapCatastroToProperty(
  bico: CatastroBico,
  fallbackRef?: string
): MappedCatastro {
  const bi = bico.bi;
  const rc = bi?.idbi?.rc;
  const refCatastral =
    refCatastralFromRc(rc) || (fallbackRef ?? "").trim().toUpperCase();

  const lourb = bi?.dt?.locs?.lous?.lourb;
  const dir = lourb?.dir;
  const loint = lourb?.loint;
  const debi = bi?.debi;

  const streetType = dir?.tv?.trim() || null;
  const streetName = dir?.nv?.trim() || null;
  const streetNumber = dir?.pnp?.trim() || null;

  const building: CatastroBuildingData = {
    street: streetName || "SIN CALLE",
    number: portalToInt(streetNumber),
    stair: loint?.es?.trim() || null,
  };

  const constructionUnits = (bico.lcons ?? []).map(
    (construccion: CatastroRefConstruccion) => {
      const lointCons = construccion.dt?.lourb?.loint;
      return {
        uso: construccion.lcd ?? null,
        escalera: lointCons?.es ?? null,
        planta: lointCons?.pt ?? null,
        puerta: lointCons?.pu ?? null,
        superficieM2: toNumber(construccion.dfcons?.stl),
        tipologia: construccion.dvcons?.dtip ?? null,
      };
    }
  );

  const constructionYear = toNumber(debi?.ant);

  const property: Record<string, any> = {
    refCatastral,
    cadastralReference: refCatastral,
    cadastralPc1: rc?.pc1 ?? null,
    cadastralPc2: rc?.pc2 ?? null,
    cadastralCar: rc?.car ?? null,
    cadastralCc1: rc?.cc1 ?? null,
    cadastralCc2: rc?.cc2 ?? null,
    tipoBien: bi?.idbi?.cn ?? null,

    province: bi?.dt?.np ?? null,
    municipality: bi?.dt?.nm ?? null,
    provinceName: bi?.dt?.np ?? null,
    municipalityName: bi?.dt?.nm ?? null,
    ineProvinceCode: bi?.dt?.loine?.cp ?? null,
    ineMunicipalityCode: bi?.dt?.loine?.cm ?? null,
    postalCode: lourb?.dp ?? null,

    streetType,
    streetName,
    streetNumber,
    cadastralFloor: loint?.pt ?? null,
    cadastralDoor: loint?.pu ?? null,
    fullAddress: bi?.ldt?.trim() || null,

    cadastralUse: debi?.luso ?? null,
    builtSurface: toNumber(debi?.sfc),
    participationCoefficient: toNumber(debi?.cpt),
    constructionYear:
      constructionYear !== null ? Math.trunc(constructionYear) : null,

    constructionUnits,
    subParcels: null,
    catastroRaw: bico as any,
    description: bico.finca?.ltp ?? null,

    // Campos base requeridos por `Property`
    number: streetNumber || "SN",
    floor: floorToInt(loint?.pt),
  };

  return { building, property };
}
