jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    isAxiosError: jest.fn(),
  },
}));

import axios from "axios";
import { AppError } from "@core/utils";
import { CatastroService } from "./CatastroService";
import { CatastroResponse } from "../types";

const mockedAxios = axios as unknown as {
  get: jest.Mock;
  isAxiosError: jest.Mock;
};

const inmuebleFixture: CatastroResponse = {
  numeroInmuebles: 1,
  inmuebles: [
    {
      tipoBien: "UR",
      referenciaCatastral: {
        referenciaCatastral: "0847106VK4704F0006FI",
        pc1: "0847106",
        pc2: "VK4704F",
        car: "0006",
        cc1: "F",
        cc2: "I",
      },
      direccion: {
        codigoProvinciaIne: "28",
        codigoMunicipioIne: "79",
        nombreProvincia: "MADRID",
        nombreMunicipio: "MADRID",
        codigoPostal: "28013",
        tipoVia: "CL",
        nombreVia: "GRAN VIA",
        numero: "1",
        planta: "01",
        puerta: "IZ",
        direccionCompleta: "CL GRAN VIA 1 Pl:01 Pt:IZ 28013 MADRID (MADRID)",
      },
      datosEconomicos: {
        uso: "Comercial",
        superficieConstruida: "445",
        coeficienteParticipacion: "6,350000",
        añoConstruccion: "1907",
      },
      unidadesConstructivas: [
        {
          uso: "OCIO HOSTEL.",
          planta: "00",
          puerta: "3B",
          superficieTotal: "25",
          tipologiaConstructiva: "HOSTELERIA-RESTAURACION",
        },
      ],
      subparcelas: [],
    },
  ],
  errores: [],
};

const axiosError = (status: number, data: unknown = {}, code?: string) => ({
  isAxiosError: true,
  code,
  response: { status, data },
});

describe("CatastroService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CATASTRO_API_KEY: "ctr_test_key",
      CATASTRO_API_BASE_URL: "https://api.catastro-api.es",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getProvincias", () => {
    it("llama al endpoint del callejero con la api key y devuelve el JSON", async () => {
      const payload = {
        numeroProvincias: 1,
        provincias: [{ nombre: "MADRID", codigoProvinciaIne: "28" }],
        errores: [],
      };
      mockedAxios.get.mockResolvedValue({ data: payload });

      const service = new CatastroService();
      const result = await service.getProvincias();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.catastro-api.es/api/callejero/provincias",
        expect.objectContaining({
          params: {},
          headers: expect.objectContaining({ "x-api-key": "ctr_test_key" }),
        })
      );
      expect(result).toEqual(payload);
    });
  });

  describe("getMunicipios", () => {
    it("envía la provincia como query param", async () => {
      mockedAxios.get.mockResolvedValue({
        data: { numeroMunicipios: 0, municipios: [], errores: [] },
      });

      const service = new CatastroService();
      await service.getMunicipios("MADRID");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.catastro-api.es/api/callejero/municipios",
        expect.objectContaining({ params: { provincia: "MADRID" } })
      );
    });
  });

  describe("getVias", () => {
    it("envía provincia y municipio como query params", async () => {
      mockedAxios.get.mockResolvedValue({
        data: { numeroVias: 0, vias: [], errores: [] },
      });

      const service = new CatastroService();
      await service.getVias({ provincia: "28", municipio: "MADRID" });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.catastro-api.es/api/callejero/vias",
        expect.objectContaining({
          params: { provincia: "28", municipio: "MADRID" },
        })
      );
    });
  });

  describe("searchByAddress", () => {
    it("envía los filtros obligatorios y omite los opcionales vacíos", async () => {
      mockedAxios.get.mockResolvedValue({ data: inmuebleFixture });

      const service = new CatastroService();
      const result = await service.searchByAddress({
        provincia: "MADRID",
        municipio: "MADRID",
        tipoVia: "CL",
        nombreVia: "GRAN VIA",
        numero: "1",
      });

      const [, config] = mockedAxios.get.mock.calls[0];
      expect(mockedAxios.get.mock.calls[0][0]).toBe(
        "https://api.catastro-api.es/api/callejero/inmueble-localizacion"
      );
      expect(config.params).toMatchObject({
        provincia: "MADRID",
        municipio: "MADRID",
        tipoVia: "CL",
        nombreVia: "GRAN VIA",
        numero: "1",
      });
      expect(config.params.bloque).toBeUndefined();
      expect(result.inmuebles[0].referenciaCatastral.referenciaCatastral).toBe(
        "0847106VK4704F0006FI"
      );
    });
  });

  describe("errores", () => {
    it("lanza un AppError 500 claro si no hay api key configurada", async () => {
      process.env.CATASTRO_API_KEY = "";

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 500,
        message: "CATASTRO_API_KEY no está configurada en el backend",
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("traduce un 401 del proveedor a AppError 502", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(axiosError(401));

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 502,
        message: "La API key de Catastro no es válida o está inactiva",
      });
    });

    it("respeta el 429 del proveedor", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(axiosError(429));

      const service = new CatastroService();

      const promise = service.getProvincias();
      await expect(promise).rejects.toBeInstanceOf(AppError);
      await expect(promise).rejects.toMatchObject({ statusCode: 429 });
    });

    it("usa el mensaje del proveedor en un 400", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(
        axiosError(400, { message: "PROVINCIA NO VALIDA" })
      );

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 400,
        message: "PROVINCIA NO VALIDA",
      });
    });

    it("devuelve 504 cuando la petición expira", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(axiosError(500, {}, "ECONNABORTED"));

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 504,
        message: "Catastro tardó demasiado en responder",
      });
    });

    it("usa la URL por defecto si no hay CATASTRO_API_BASE_URL", async () => {
      delete process.env.CATASTRO_API_BASE_URL;
      mockedAxios.get.mockResolvedValue({
        data: { numeroProvincias: 0, provincias: [], errores: [] },
      });

      const service = new CatastroService();
      await service.getProvincias();

      expect(mockedAxios.get.mock.calls[0][0]).toBe(
        "https://api.catastro-api.es/api/callejero/provincias"
      );
    });
  });
});
