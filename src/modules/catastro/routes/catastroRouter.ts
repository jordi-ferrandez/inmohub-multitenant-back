import express from "express";
import { bindAllMethods } from "@core/utils";
import { CatastroController } from "../controllers";
import {
  validateCatastroMunicipios,
  validateCatastroSearch,
  validateCatastroVias,
} from "../validators";

const catastroRouter = express.Router();
const catastroController = bindAllMethods(new CatastroController());

catastroRouter.get(
  "/provincias",
  catastroController.getProvincias
);

catastroRouter.get(
  "/municipios",
  validateCatastroMunicipios,
  catastroController.getMunicipios
);

catastroRouter.get(
  "/vias",
  validateCatastroVias,
  catastroController.getVias
);

catastroRouter.get(
  "/inmueble-localizacion",
  validateCatastroSearch,
  catastroController.searchByAddress
);

catastroRouter.get(
  "/inmueble-refcatastral/:refCatastral",
  catastroController.getInmuebleByRefCatastral
);

export { catastroRouter };