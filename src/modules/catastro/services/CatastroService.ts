import axios from "axios";
import { AppError } from "@core/utils";
import {
  CatastroMunicipiosResponse,
  CatastroProvinciasResponse,
  CatastroResponse,
  CatastroSearchQuery,
  CatastroViasQuery,
  CatastroViasResponse,
  CatastroSearchResult,
  CatastroInmuebleByRefCatastral
} from "../types";

// Endpoint base del SGC (Servicio de Catastro General, público y gratuito)
const DEFAULT_BASE_URL =
  "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json";

const REQUEST_TIMEOUT_MS = 30_000;

// Headers confirmados que funcionan con el SGC (ovc.catastro.meh.es)
const SGC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

function isHtmlResponse(data: any): data is string {
  return (
    typeof data === "string" &&
    (data.trim().startsWith("<!doctype html>") || data.trim().startsWith("<html>"))
  );
}

function parseSgcResponse<T>(data: any): T {
  if (isHtmlResponse(data)) {
    const msgMatch = data.match(/<[^>]*>([^<]+)<\/[^>]*>/);
    const message = msgMatch ? msgMatch[1] : "Error desconocido del servicio catastral";
    throw new AppError(message, 502);
  }
  if (typeof data === "object" && !Array.isArray(data)) return data as T;
  try {
    return JSON.parse(data as string) as T;
  } catch {
    throw new AppError("Respuesta inesperada del servicio catastral", 502);
  }
}

class CatastroService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CATASTRO_API_BASE_URL || DEFAULT_BASE_URL;
  }

  private async getJson<T>(endpoint: string): Promise<T> {
    try {
      const { data } = await axios.get<T>(`${this.baseUrl}${endpoint}`, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: SGC_HEADERS,
      });
      return parseSgcResponse<T>(data);
    } catch (error) {
      return this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    const ax = error as any as {
      response?: { status?: number; data?: any };
      code?: string;
    };

    if (ax.code === "ECONNABORTED") {
      throw new AppError("Catastro tardó demasiado en responder", 504);
    }
    if (!ax.response?.status) {
      throw new AppError("Error al consultar el servicio catastral", 502);
    }

    const status = ax.response.status;
    const upstreamData = ax.response.data;
    const upstreamMessage =
      (upstreamData && typeof upstreamData === "object"
        ? upstreamData.message || upstreamData.error
        : undefined) as string | undefined;

    switch (status) {
      case 400:
        throw new AppError(
          upstreamMessage ||
            "Parámetros no válidos. Revisa provincia, municipio y vía.",
          400
        );
      case 401:
      case 403:
        throw new AppError("Acceso denegado al servicio catastral.", 502);
      case 429:
        throw new AppError("Se ha alcanzado el límite de peticiones. Inténtalo más tarde.", 429);
      default:
        if (ax.code === "ECONNABORTED") {
          throw new AppError("Catastro tardó demasiado en responder", 504);
        }
        throw new AppError(
          upstreamMessage || "Error al consultar el servicio catastral",
          502
        );
    }
  }

  async getProvincias(): Promise<CatastroProvinciasResponse> {
    return this.getJson<CatastroProvinciasResponse>("/ObtenerProvincias");
  }

  async getMunicipios(provincia: string): Promise<CatastroMunicipiosResponse> {
    
    return this.getJson<CatastroMunicipiosResponse>(
      `/ObtenerMunicipios?Provincia=${encodeURIComponent(provincia)}`
    );
  }

  async getVias(query: CatastroViasQuery): Promise<CatastroViasResponse> {
    const { provincia, municipio, tipoVia, nombreVia } = query;

    const params: Record<string, string> = {
      Provincia: provincia,
      Municipio: municipio,
    };

    if (tipoVia) params.Sigla = tipoVia;
    if (nombreVia) params.Calle = nombreVia;

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return this.getJson<CatastroViasResponse>(
      `/ObtenerCallejero?${queryString}`
    );
  }

  async searchByAddress(query: CatastroSearchQuery): Promise<CatastroSearchResult> {
    const { provincia, municipio, nombreVia, numero, tipoVia } = query;

    const params: Record<string, string> = {
      Provincia: provincia,
      Municipio: municipio,
      Sigla: tipoVia ?? "CL",
      Calle: nombreVia,
      Numero: numero,
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return this.getJson<CatastroSearchResult>(
      `/Consulta_DNPLOC?${queryString}`
    );
  }

async getInmuebleByrefCatastral(refCatastral: string): Promise<CatastroInmuebleByRefCatastral> {

    return this.getJson<CatastroInmuebleByRefCatastral>(
      `/Consulta_DNPRC?RefCat=${encodeURIComponent(refCatastral)}`
    );
  }

}

export const catastroService = new CatastroService();
export { CatastroService };