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

const mockedAxios = axios as unknown as {
  get: jest.Mock;
  isAxiosError: jest.Mock;
};

// === Fixtures del SGC (ovc.catastro.meh.es) ===

/** Respuesta de ObtenerProvincias */
const provinciasPayload = {
  numeroProvincias: 50,
  provincias: [
    { nombre: "MADRID", codigoProvinciaIne: "28" },
    { nombre: "BARCELONA", codigoProvinciaIne: "08" },
  ],
  errores: [],
};

/** Respuesta de ObtenerMunicipios */
const municipiosPayload = {
  numeroMunicipios: 2,
  municipios: [
    {
      codigoDelegacion: "28",
      codigoProvinciaIne: "28",
      codigoMunicipioMeh: "1",
      codigoMunicipioIne: "1",
      nombreMunicipio: "MADRID",
    },
  ],
  errores: [],
};

/** Respuesta de ObtenerCallejero (vías) */
const viasPayload = {
  numeroVias: 3,
  vias: [
    {
      codigoProvinciaIne: "28",
      codigoMunicipioIne: "79",
      codigoVia: "1234",
      nombreVia: "GRAN VIA",
      tipoVia: "CL",
    },
  ],
  errores: [],
};

/** Respuesta de ObtenerNumerero (validación de número) */
const numereroPayload = {
  consulta_numereroResult: {
    control: { cunum: 1 },
    nump: [
      {
        pc: { pc1: "28013", pc2: "VK4704F" },
        num: { pnp: "1" },
      },
    ],
  },
};

/** Respuesta de Consulta_DNPLOC (datos no protegidos por localización) */
const dnplocPayload = {
  consulta_dnplocResult: {
    control: { cudnp: 1 },
    lrcdnp: {
      rcdnp: [
        {
          rc: { pc1: "9872023", pc2: "VK4797B", car: "0001", cc1: "WX", cc2: "0000" },
          dt: {
            loine: { cp: "28", cm: "079" },
            cmc: "079",
            np: "MADRID",
            nm: "MADRID",
            locs: {
              lous: {
                lourb: {
                  dir: { cv: "2", tv: "CL", nv: "COLON", pnp: "12" },
                  loint: { es: "1", pt: "-4", pu: "01" },
                  dp: "28001",
                  dm: "MADRID",
                },
              },
            },
          },
          debi: { luso: "Almacén-Estacionamiento", sfc: "32", cpt: "0,20", ant: "1980" },
        },
      ],
    },
  },
};

/** Respuesta de ObtenerCallejero con error (código 400 por parámetros) */
const viasErrorPayload = {
  numeroVias: 0,
  vias: [],
  errores: [{ codigo: "400", descripcion: "Parámetros obligatorios faltantes" }],
};

describe("CatastroService (SGC - ovc.catastro.meh.es)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Para SGC no es necesaria API key; guardamos la env original y no la forzamos.
    process.env = {
      ...originalEnv,
      // No seteamos CATASTRO_API_KEY ni CATASTRO_API_BASE_URL por defecto;
      // el service usará DEFAULT_BASE_URL que apunta al SGC.
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getProvincias", () => {
    it("llama al endpoint ObtenerProvincias del SGC y devuelve el JSON", async () => {
      mockedAxios.get.mockResolvedValue({ data: provinciasPayload });

      const service = new CatastroService();
      const result = await service.getProvincias();

      // El DEFAULT_BASE_URL apunta al SGC
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ObtenerProvincias",
        expect.objectContaining({
          // SGC no usa headers de auth
          headers: {},
        })
      );
      expect(result).toEqual(provinciasPayload);
    });

    it("usa la URL por defecto si no hay CATASTRO_API_BASE_URL", async () => {
      delete process.env.CATASTRO_API_BASE_URL;
      mockedAxios.get.mockResolvedValue({ data: provinciasPayload });

      const service = new CatastroService();
      await service.getProvincias();

      // Debe usar la URL por defecto del SGC
      expect(mockedAxios.get.mock.calls[0][0]).toBe(
        "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ObtenerProvincias"
      );
    });
  });

  describe("getMunicipios", () => {
    it("envía la provincia como query param al SGC", async () => {
      mockedAxios.get.mockResolvedValue({ data: municipiosPayload });

      const service = new CatastroService();
      await service.getMunicipios("MADRID");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ObtenerMunicipios?Provincia=MADRID",
        expect.objectContaining({
          headers: {},
        })
      );
    });
  });

  describe("getVias", () => {
    it("envía provincia y municipio al SGC", async () => {
      mockedAxios.get.mockResolvedValue({ data: viasPayload });

      const service = new CatastroService();
      await service.getVias({ provincia: "28", municipio: "MADRID" });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ObtenerCallejero?Provincia=28&Municipio=MADRID",
        expect.objectContaining({
          headers: {},
        })
      );
    });

    it("acepta filtros opcionales tipoVia y nombreVia", async () => {
      mockedAxios.get.mockResolvedValue({ data: viasPayload });

      const service = new CatastroService();
      await service.getVias({ provincia: "28", municipio: "MADRID", tipoVia: "CL", nombreVia: "GRAN VIA" });

      const [, config] = mockedAxios.get.mock.calls[0];
      // El SGC usa Sigla y Calle
      expect(config.params).toMatchObject({
        Provincia: "28",
        Municipio: "MADRID",
        Sigla: "CL",
        Calle: "GRAN VIA",
      });
    });
  });

  describe("searchByAddress", () => {
    it("consulta Consulta_DNPLOC y devuelve los inmuebles del SGC", async () => {
      mockedAxios.get.mockResolvedValue({ data: dnplocPayload });

      const service = new CatastroService();
      const result = await service.searchByAddress({
        provincia: "MADRID",
        municipio: "MADRID",
        tipoVia: "CL",
        nombreVia: "COLON",
        numero: "12",
      });

      expect(result.consulta_dnplocResult.lrcdnp.rcdnp).toHaveLength(1);
      expect(
        result.consulta_dnplocResult.lrcdnp.rcdnp[0].rc.pc1
      ).toBe("9872023");
    });

    it("devuelve lista vacía cuando el SGC no encuentra inmuebles", async () => {
      const sinResultados = {
        consulta_dnplocResult: {
          control: { cudnp: 0 },
          lrcdnp: { rcdnp: [] },
        },
      };
      mockedAxios.get.mockResolvedValue({ data: sinResultados });

      const service = new CatastroService();
      const result = await service.searchByAddress({
        provincia: "MADRID",
        municipio: "MADRID",
        tipoVia: "CL",
        nombreVia: "COLON",
        numero: "9999", // número inexistente
      });

      expect(result.consulta_dnplocResult.lrcdnp.rcdnp).toEqual([]);
    });

    it("usa Sigla y Calle del query correctamente", async () => {
      mockedAxios.get.mockResolvedValue({ data: dnplocPayload });

      const service = new CatastroService();
      await service.searchByAddress({
        provincia: "28", // código INE de Madrid
        municipio: "MADRID",
        tipoVia: "AV", // Avenida
        nombreVia: "PASEO DE LA CASTELLANA",
        numero: "12",
      });

      // Verificamos que axios.get fue llamado a Consulta_DNPLOC con Sigla=AV
      expect(mockedAxios.get).toHaveBeenCalled();
      const [url] = mockedAxios.get.mock.calls[0];
      expect(url).toContain("Sigla=AV");
      expect(url).toContain("Calle=PASEO%20DE%20LA%20CASTELLANA");
      expect(url).toContain("Numero=12");
    });
  });

  describe("errores y límites", () => {
    it("traduce un error 400 del SGC a AppError 400", async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { message: "PROVINCIA NO VALIDA" } },
      });

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 400,
        message: "PROVINCIA NO VALIDA",
      });
    });

    it("traduce un 429 del SGC a AppError 429", async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 429, data: {} },
      });

      const service = new CatastroService();

      const promise = service.getProvincias();
      await expect(promise).rejects.toBeInstanceOf(AppError);
      await expect(promise).rejects.toMatchObject({ statusCode: 429 });
    });

    it("devuelve 504 en caso de timeout (ECONNABORTED)", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue({
        code: "ECONNABORTED",
      });

      const service = new CatastroService();

      await expect(service.getProvincias()).rejects.toMatchObject({
        statusCode: 504,
        message: "Catastro tardó demasiado en responder",
      });
    });
  });
});