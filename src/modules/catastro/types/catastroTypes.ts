import { z } from "zod";

export const catastroSearchQuerySchema = z.object({
  provincia: z.string().trim().min(1, "La provincia es obligatoria"),
  municipio: z.string().trim().min(1, "El municipio es obligatorio"),
  nombreVia: z.string().trim().min(1, "La vía es obligatoria"),
  numero: z.string().trim().min(1, "El número es obligatorio"),
  // La API externa exige tipoVia. Por defecto "CL" (calle).
  tipoVia: z.string().trim().min(1).optional().default("CL"),
  bloque: z.string().trim().optional(),
  escalera: z.string().trim().optional(),
  planta: z.string().trim().optional(),
  puerta: z.string().trim().optional(),
});

export type CatastroSearchQuery = z.infer<typeof catastroSearchQuerySchema>;

export interface CatastroReferenciaCatastral {
  referenciaCatastral: string;
  pc1: string;
  pc2: string;
  car: string;
  cc1: string;
  cc2: string;
}

export interface CatastroDireccion {
  codigoProvinciaIne: string;
  codigoMunicipioIne: string;
  nombreProvincia: string;
  nombreMunicipio: string;
  codigoPostal: string;
  tipoVia: string;
  nombreVia: string;
  numero: string;
  planta?: string;
  puerta?: string;
  direccionCompleta: string;
}

export interface CatastroDatosEconomicos {
  uso: string;
  superficieConstruida?: string;
  coeficienteParticipacion?: string;
  añoConstruccion?: string;
}

export interface CatastroUnidadConstructiva {
  uso?: string;
  planta?: string;
  puerta?: string;
  superficieTotal?: string;
  tipologiaConstructiva?: string;
}

export interface CatastroSubparcela {
  codigo?: string;
  descripcion?: string;
}

export interface CatastroError {
  codigo?: string;
  descripcion?: string;
}

export interface CatastroInmueble {
  tipoBien: string;
  referenciaCatastral: CatastroReferenciaCatastral;
  direccion: CatastroDireccion;
  datosEconomicos: CatastroDatosEconomicos;
  unidadesConstructivas: CatastroUnidadConstructiva[];
  subparcelas: CatastroSubparcela[];
}

export interface CatastroResponse {
  numeroInmuebles: number;
  inmuebles: CatastroInmueble[];
  errores: CatastroError[];
}

/* ---------- Callejero: provincias, municipios y vías ---------- */

export interface CatastroProvincia {
  nombre?: string;
  codigoProvinciaIne?: string;
}

export interface CatastroProvinciasResponse {
  numeroProvincias: number;
  provincias: CatastroProvincia[];
  errores: CatastroError[];
}

export interface CatastroMunicipio {
  codigoDelegacion?: string;
  codigoProvinciaIne?: string;
  codigoMunicipioMeh?: string;
  codigoMunicipioIne?: string;
  nombreMunicipio?: string;
}

export interface CatastroMunicipiosResponse {
  numeroMunicipios: number;
  municipios: CatastroMunicipio[];
  errores: CatastroError[];
}

export interface CatastroVia {
  codigoMunicipioIne?: string;
  codigoProvinciaIne?: string;
  codigoVia?: string;
  nombreVia?: string;
  tipoVia?: string;
}

export interface CatastroViasResponse {
  numeroVias: number;
  vias: CatastroVia[];
  errores: CatastroError[];
}

export const catastroProvinciaQuerySchema = z.object({
  provincia: z.string().trim().min(1, "La provincia es obligatoria"),
});

export type CatastroProvinciaQuery = z.infer<
  typeof catastroProvinciaQuerySchema
>;

export const catastroViasQuerySchema = z.object({
  provincia: z.string().trim().min(1, "La provincia es obligatoria"),
  municipio: z.string().trim().min(1, "El municipio es obligatorio"),
  tipoVia: z.string().trim().optional(),
  nombreVia: z.string().trim().optional(),
});

export type CatastroViasQuery = z.infer<typeof catastroViasQuerySchema>;
