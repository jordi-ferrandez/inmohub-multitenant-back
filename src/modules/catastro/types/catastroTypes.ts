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
 cpine: string,
  np: string  
}

export interface CatastroProvinciasResponse {
  // numeroProvincias: number;
  // provincias: CatastroProvincia[];
  // errores: CatastroError[];
  consulta_provincieroResult:{
    control:{
cuprov: number;
    }
  }
   provinciero: {
      prov: CatastroProvincia[]
}}

export interface CatastroMunicipio {
  // codigoDelegacion?: string;
  // codigoProvinciaIne?: string;
  // codigoMunicipioMeh?: string;
  // codigoMunicipioIne?: string;
  // nombreMunicipio?: string;
    locat: {
            cd: string;
            cmc: string;
          },
          loine: {
            cp: string;
            cm: string;
          },
          nm: string;
}

export interface CatastroMunicipiosResponse {
  // numeroMunicipios: number;
  // municipios: CatastroMunicipio[];
  // errores: CatastroError[];
  consulta_municipieroResult: {
    control: {
      cumun: number;
    };
  };
  municipiero: {
    muni: CatastroMunicipio[];
  };
}

export interface CatastroVia {
  // codigoMunicipioIne?: string;
  // codigoProvinciaIne?: string;
  // codigoVia?: string;
  // nombreVia?: string;
  // tipoVia?: string;
   loine: {
            cp: string;
            cm: string;
          },
          dir: {
            cv: string;
            tv: string;
            nv: string;
          },
          dirine: {
            ecine: string;
            esine: string;
            nucine: string;
            sine: string;
            vine: string;
            deine: string;
          }
}

export interface CatastroViasResponse {
  // numeroVias: number;
  // vias: CatastroVia[];
  // errores: CatastroError[];
consulta_callejeroResult: {
    control: {
      cuca: number;
    };
  };
  callejero: {
    calle: CatastroVia[];
  };

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

export interface CatastroSearch {
     
          rc: {
            pc1: string;
            pc2: string;
            car: string;
            cc1: string;
            cc2: string;
          },
          dt: {
            loine: {
              cp: string;
              cm: string
            },
            cmc:  string;
            np:  string;
            nm:  string;
            locs: {
              lous: {
                lourb: {
                  dir: {
                    cv:  string;  
                    tv: string; 
                    nv: string; 
                    pnp: string; 
                  },
                  loint: {
                    es: string; 
                    pt: string; 
                    pu: string; 
                  },
                  dp: string; 
                  dm: string; 
                }
              }
            }
          },
          debi: {
            luso: string; 
            sfc: string; 
            cpt: string; 
            ant: string; 
          }
        
}

export interface CatastroSearchResult {
   consulta_dnplocResult: {
    control: {
      cudnp: number;
    },
    lrcdnp: {
      rcdnp:CatastroSearch[]
    }
  }
}


export interface CatastroRefRc {
  pc1: string;
  pc2: string;
  car: string;
  cc1: string;
  cc2: string;
}

export interface CatastroRefLourb {
  dir?: {
    cv?: string;
    tv?: string;
    nv?: string;
    pnp?: string;
  };
  loint?: {
    es?: string;
    pt?: string;
    pu?: string;
  };
  dp?: string;
  dm?: string;
}

export interface CatastroRefBi {
  idbi: {
    cn?: string;
    rc: CatastroRefRc;
  };
  dt?: {
    loine?: {
      cp?: string;
      cm?: string;
    };
    cmc?: string;
    np?: string;
    nm?: string;
    locs?: {
      lous?: {
        lourb?: CatastroRefLourb;
      };
    };
  };
  ldt?: string;
  debi?: {
    luso?: string;
    sfc?: string;
    cpt?: string;
    ant?: string;
  };
}

export interface CatastroRefConstruccion {
  lcd?: string;
  dt?: {
    lourb?: {
      loint?: {
        es?: string;
        pt?: string;
        pu?: string;
      };
    };
  };
  dfcons?: {
    stl?: string;
  };
  dvcons?: {
    dtip?: string;
  };
}

export interface CatastroRefFinca {
  ldt?: string;
  ltp?: string;
  dff?: {
    ss?: string;
  };
  infgraf?: {
    igraf?: string;
  };
}

export interface CatastroBico {
  bi: CatastroRefBi;
  finca?: CatastroRefFinca;
  lcons?: CatastroRefConstruccion[];
}

export interface CatastroInmuebleByRefCatastral {
  consulta_dnprcResult: {
    control?: {
      cudnp?: number;
      cucons?: number;
    };
    bico: CatastroBico;
  };
}
