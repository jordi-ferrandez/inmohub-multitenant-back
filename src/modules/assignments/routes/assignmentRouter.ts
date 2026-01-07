import { Router } from "express";
import { assignmentController } from "../controllers";
import {
  validateCreateAssignment,
  validateUpdateAssignment,
  validateAssignmentQuery,
  validateAssignmentParams,
} from "../validators";
import { authenticationToken } from "@core/middlewares";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticationToken);

// Rutas principales de asignaciones
router.post(
  "/",
  validateCreateAssignment,
  assignmentController.createAssignment.bind(assignmentController)
);

router.get(
  "/",
  validateAssignmentQuery,
  assignmentController.getAssignments.bind(assignmentController)
);

// Rutas específicas ANTES de /:id para evitar conflictos
router.get(
  "/summary",
  assignmentController.getAssignmentsSummary.bind(assignmentController)
);

router.get(
  "/user/:userId",
  assignmentController.getAssignmentsByUser.bind(assignmentController)
);

router.get(
  "/building/:buildingId",
  assignmentController.getAssignmentsByBuilding.bind(assignmentController)
);

// Rutas con parámetros al final
router.get(
  "/:id",
  validateAssignmentParams,
  assignmentController.getAssignmentById.bind(assignmentController)
);

router.put(
  "/:id",
  validateAssignmentParams,
  validateUpdateAssignment,
  assignmentController.updateAssignment.bind(assignmentController)
);

router.delete(
  "/:id",
  validateAssignmentParams,
  assignmentController.deleteAssignment.bind(assignmentController)
);

export { router as assignmentRouter };
