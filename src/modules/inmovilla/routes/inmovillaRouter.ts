import express from "express";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";
import { upload } from "@core/config/multer";
import { InmovillaController } from "../controllers";
import { validateCSVFile } from "../validators";

const inmovillaRouter = express.Router();
const inmovillaController = bindAllMethods(new InmovillaController());

inmovillaRouter.post(
  "/import-properties-csv",
  authenticationToken,
  upload.single("csvFile"),
  validateCSVFile,
  inmovillaController.importCSV
);

export { inmovillaRouter };
