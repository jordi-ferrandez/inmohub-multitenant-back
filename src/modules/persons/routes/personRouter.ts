import express from "express";
import { PersonController } from "../controllers/PersonController";
import { bindAllMethods } from "@core/utils";
import { authenticationToken } from "@core/middlewares";

const personRouter = express.Router();
const personController = bindAllMethods(new PersonController());

// Todas las rutas de persons requieren autenticación
personRouter.use(authenticationToken);

// GET /v1/persons/search - Búsqueda rápida de personas (PRIMERO)
personRouter.get("/search", personController.search);

// GET /v1/persons - Listar personas con paginación y búsqueda
personRouter.get("/", personController.list);

// POST /v1/persons - Crear persona
personRouter.post("/", personController.create);

// PATCH /v1/persons/:id - Actualizar persona
personRouter.patch("/:id", personController.update);

// DELETE /v1/persons/:id - Eliminar persona (soft delete)
personRouter.delete("/:id", personController.delete);

// POST /v1/persons/:id/properties/:propertyId - Asignar persona a propiedad
personRouter.post(
  "/:id/properties/:propertyId",
  personController.assignProperty
);

// DELETE /v1/persons/:id/properties/:propertyId - Desasignar persona de propiedad
personRouter.delete(
  "/:id/properties/:propertyId",
  personController.unassignProperty
);

// GET /v1/persons/:id/relations - Obtener relaciones de una persona
personRouter.get("/:id/relations", personController.getRelations);

export { personRouter };
