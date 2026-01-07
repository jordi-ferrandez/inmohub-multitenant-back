import express from "express";
import { ActivityController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import { validateActivityQuery, validateActivityItemsQuery } from "../validators";
import { authenticationToken } from "@core/middlewares";

const activityRouter = express.Router();
const activityController = bindAllMethods(new ActivityController());

// Todas las rutas requieren autenticación
activityRouter.use(authenticationToken);

// GET /api/v1/activity - Obtener reporte de actividad
activityRouter.get(
  "/",
  validateActivityQuery,
  activityController.getActivityReport.bind(activityController)
);

// GET /api/v1/activity/items - Obtener items de actividad (seguimientos y buzoneamientos)
activityRouter.get(
  "/items",
  validateActivityItemsQuery,
  activityController.getActivityItems.bind(activityController)
);

export default activityRouter;

