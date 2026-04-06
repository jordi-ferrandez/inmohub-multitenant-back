import { Router } from "express";
import { assignmentController } from "../controllers";
import {
  validateCreateAssignment,
  validateUpdateAssignment,
  validateAssignmentQuery,
  validateAssignmentParams,
} from "../validators";
import { authenticationToken, requireDirectorRole } from "@core/middlewares";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticationToken);

// Rutas de escritura solo para directores
router.post(
  "/",
  requireDirectorRole,
  validateCreateAssignment,
  assignmentController.createAssignment.bind(assignmentController)
);

router.put(
  "/:id",
  requireDirectorRole,
  validateAssignmentParams,
  validateUpdateAssignment,
  assignmentController.updateAssignment.bind(assignmentController)
);

router.delete(
  "/:id",
  requireDirectorRole,
  validateAssignmentParams,
  assignmentController.deleteAssignment.bind(assignmentController)
);

// Rutas de lectura para todos
router.get(
  "/",
  validateAssignmentQuery,
  assignmentController.getAssignments.bind(assignmentController)
);

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

router.get(
  "/:id",
  validateAssignmentParams,
  assignmentController.getAssignmentById.bind(assignmentController)
);

export { router as assignmentRouter };
