import { Router } from "express";
import {
  companyController,
  superadminUserController,
  superadminStatsController,
} from "../controllers";
import {
  authenticationToken as auth,
  requireSuperAdmin,
  tenantMiddleware,
} from "@core/middlewares";
import {
  validateCreateCompany,
  validateUpdateCompany,
  validateMoveUser,
} from "../validators";

const router = Router();

// Todas las rutas requieren autenticación + superadmin
router.use(auth, tenantMiddleware, requireSuperAdmin);

// Empresas
router.post("/companies", validateCreateCompany, (req, res) =>
  companyController.create(req, res)
);
router.get("/companies", (req, res) => companyController.getAll(req, res));
router.get("/companies/:id", (req, res) => companyController.getById(req, res));
router.patch("/companies/:id", validateUpdateCompany, (req, res) =>
  companyController.update(req, res)
);
router.delete("/companies/:id", (req, res) =>
  companyController.delete(req, res)
);

// Usuarios globales
router.get("/users", (req, res) => superadminUserController.getAll(req, res));
router.patch("/users/:id/move", validateMoveUser, (req, res) =>
  superadminUserController.moveUser(req, res)
);

// Estadísticas
router.get("/stats", (req, res) => superadminStatsController.getStats(req, res));

export default router;
