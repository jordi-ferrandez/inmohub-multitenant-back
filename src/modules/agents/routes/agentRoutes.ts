import { Router } from "express";
import { AgentController } from "../controllers/AgentController";
import { requireAgentRole } from "../../followups/middlewares";
import { authenticationToken } from "@core/middlewares";
import { validateParams, validateQuery } from "../../followups/validators";
import { z } from "zod";
import { bindAllMethods } from "@core/utils";

const router = Router();
const agentController = bindAllMethods(new AgentController());

// Todas las rutas requieren autenticación
router.use(authenticationToken);

// Ruta de propiedades disponibles - accesible para cualquier usuario autenticado
router.get(
  "/properties/available",
  validateQuery(
    z.object({
      search: z.string().optional(),
      page: z.coerce.number().int().min(1).optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    })
  ),
  agentController.getAvailableProperties
);

// El resto de rutas requieren rol de agente
router.use(requireAgentRole);

// Obtener asignaciones activas del agente
router.get("/assignments/active", agentController.getActiveAssignments);

// Obtener historial de asignaciones del agente
router.get("/assignments/history", agentController.getAssignmentsHistory);

// Obtener historial de seguimientos de una propiedad específica
router.get(
  "/properties/:propertyId/followups",
  validateParams(
    z.object({
      propertyId: z.string().regex(/^\d+$/, "ID de propiedad inválido"),
    })
  ),
  agentController.getPropertyFollowUpsHistory
);

export default router;
