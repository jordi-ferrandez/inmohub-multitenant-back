import express from "express";
import { bindAllMethods } from "@core/utils";
import { authenticationToken, requireDirectorRole } from "@core/middlewares";
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
  authenticationToken,
  requireDirectorRole,
  catastroController.getProvincias
);

catastroRouter.get(
  "/municipios",
  authenticationToken,
  requireDirectorRole,
  validateCatastroMunicipios,
  catastroController.getMunicipios
);

catastroRouter.get(
  "/vias",
  authenticationToken,
  requireDirectorRole,
  validateCatastroVias,
  catastroController.getVias
);

catastroRouter.get(
  "/inmueble-localizacion",
  authenticationToken,
  requireDirectorRole,
  validateCatastroSearch,
  catastroController.searchByAddress
);

export { catastroRouter };
