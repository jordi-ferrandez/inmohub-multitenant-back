import { Router } from "express";
import { FollowUpController } from "../controllers";
import {
  requireAgentRole,
  requireDirectorRole,
  requireAgentOrDirectorRole,
} from "../middlewares";
import { authenticationToken } from "@core/middlewares";
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  followUpQuerySchema,
  followUpParamsSchema,
  validateRequest,
  validateParams,
  validateQuery,
} from "../validators";
import { bindAllMethods } from "@core/utils";

const router = Router();
const followUpController = bindAllMethods(new FollowUpController());

// Todas las rutas requieren autenticación
router.use(authenticationToken);

// Crear seguimiento - Cualquier usuario autenticado
router.post(
  "/",
  validateRequest(createFollowUpSchema),
  followUpController.createFollowUp
);

// Obtener seguimiento por ID - Agentes (solo sus propios) y Directores (todos)
router.get(
  "/:id",
  requireAgentOrDirectorRole,
  validateParams(followUpParamsSchema),
  followUpController.getFollowUpById
);

// Obtener lista de seguimientos - Agentes (solo sus propios) y Directores (todos)
router.get(
  "/",
  requireAgentOrDirectorRole,
  validateQuery(followUpQuerySchema),
  followUpController.getFollowUps
);

// Actualizar seguimiento - Solo el agente que lo creó
router.put(
  "/:id",
  requireAgentRole,
  validateRequest(updateFollowUpSchema),
  followUpController.updateFollowUp
);

// Eliminar seguimiento - Solo el agente que lo creó
router.delete(
  "/:id",
  requireAgentRole,
  validateParams(followUpParamsSchema),
  followUpController.deleteFollowUp
);

// Estadísticas de seguimientos - Agentes (sus propias) y Directores (todos)
router.get(
  "/stats/overview",
  requireAgentOrDirectorRole,
  followUpController.getFollowUpStats
);

// Vista general para directores - Solo directores
router.get(
  "/directors/overview",
  requireDirectorRole,
  followUpController.getDirectorsFollowUpOverview
);

// Completar seguimiento - Solo agentes (sus propios)
router.post(
  "/:id/complete",
  requireAgentRole,
  validateParams(followUpParamsSchema),
  followUpController.completeFollowUp
);

// Obtener seguimientos planificados - Agentes (sus propios) y Directores (opcional userId)
router.get(
  "/planned",
  requireAgentOrDirectorRole,
  followUpController.getPlannedFollowUps
);

// Obtener seguimientos completados - Agentes (sus propios) y Directores (opcional userId)
router.get(
  "/completed",
  requireAgentOrDirectorRole,
  followUpController.getCompletedFollowUps
);

export default router;
