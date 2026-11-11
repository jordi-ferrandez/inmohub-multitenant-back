import axios from "axios";
import { AppError } from "@core/utils";
import {
  CatastroMunicipiosResponse,
  CatastroProvinciasResponse,
  CatastroResponse,
  CatastroSearchQuery,
  CatastroViasQuery,
  CatastroViasResponse,
} from "../types";

const DEFAULT_BASE_URL = "https://api.catastro-api.es";
const REQUEST_TIMEOUT_MS = 20_000;

class CatastroService {
  private get baseUrl(): string {
    const configured = process.env.CATASTRO_API_BASE_URL?.trim();
    return (configured || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private get apiKey(): string | undefined {
    return process.env.CATASTRO_API_KEY?.trim();
  }

  /**
   * Petición autenticada contra CatastroAPI. Traduce los errores del
   * proveedor a AppError con un mensaje entendible para el usuario.
   */
  private async getJson<T>(
    path: string,
    params: Record<string, string | undefined> = {}
  ): Promise<T> {
    const apiKey = this.apiKey;

    if (!apiKey) {
      throw new AppError(
        "CATASTRO_API_KEY no está configurada en el backend",
        500
      );
    }

    try {
      const { data } = await axios.get<T>(`${this.baseUrl}${path}`, {
        params,
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      });

      return data;
    } catch (error) {
      return this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const upstreamData = error.response?.data as
        | { message?: string; error?: string }
        | undefined;
      const upstreamMessage = upstreamData?.message || upstreamData?.error;

      switch (status) {
        case 400:
          throw new AppError(
            upstreamMessage ||
              "Parámetros no válidos. Revisa la provincia, el municipio y la vía.",
            400
          );
        case 401:
          throw new AppError(
            "La API key de Catastro no es válida o está inactiva",
            502
          );
        case 429:
          throw new AppError(
            "Se ha alcanzado el límite de peticiones de Catastro. Inténtalo más tarde.",
            429
          );
        default:
          break;
      }

      if (error.code === "ECONNABORTED") {
        throw new AppError("Catastro tardó demasiado en responder", 504);
      }

      throw new AppError(
        upstreamMessage || "Error al consultar la API de Catastro",
        502
      );
    }

    throw error instanceof Error
      ? error
      : new AppError("Error desconocido al consultar Catastro", 502);
  }

  /** Listado completo de provincias. */
  async getProvincias(): Promise<CatastroProvinciasResponse> {
    return this.getJson<CatastroProvinciasResponse>(
      "/api/callejero/provincias"
    );
  }

  /** Municipios de una provincia (nombre o código INE). */
  async getMunicipios(provincia: string): Promise<CatastroMunicipiosResponse> {
    return this.getJson<CatastroMunicipiosResponse>(
      "/api/callejero/municipios",
      { provincia }
    );
  }

  /** Vías de un municipio, opcionalmente filtradas por tipo y nombre. */
  async getVias(query: CatastroViasQuery): Promise<CatastroViasResponse> {
    return this.getJson<CatastroViasResponse>("/api/callejero/vias", {
      provincia: query.provincia,
      municipio: query.municipio,
      tipoVia: query.tipoVia,
      nombreVia: query.nombreVia,
    });
  }

  /**
   * Consulta inmuebles por localización (provincia, municipio, vía y número).
   */
  async searchByAddress(query: CatastroSearchQuery): Promise<CatastroResponse> {
    return this.getJson<CatastroResponse>(
      "/api/callejero/inmueble-localizacion",
      {
        provincia: query.provincia,
        municipio: query.municipio,
        tipoVia: query.tipoVia,
        nombreVia: query.nombreVia,
        numero: query.numero,
        bloque: query.bloque,
        escalera: query.escalera,
        planta: query.planta,
        puerta: query.puerta,
      }
    );
  }
}

export const catastroService = new CatastroService();
export { CatastroService };
