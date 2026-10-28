import { Request, Response } from "express";
import { PersonService } from "../services/PersonService";
import {
  createPersonBodySchema,
  updatePersonBodySchema,
  getPersonsQuerySchema,
  searchPersonsQuerySchema,
  assignPropertyBodySchema,
  unassignPropertyBodySchema,
} from "../types/personTypes";
import { successResponse, errorResponse, paginatedResponse } from "@core/utils";

export class PersonController {
  private service = new PersonService();

  /**
   * @openapi
   * /v1/persons:
   *   post:
   *     tags: [Persons]
   *     summary: Crear una nueva persona (propietario/inquilino)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Persona creada
   */
  async create(req: Request, res: Response) {
    try {
      const body = createPersonBodySchema.parse(req.body);
      const companyId = req.companyId ?? null;
      const person = await this.service.createPerson(body, companyId);
      successResponse(res, person, 201);
    } catch (err: any) {
      if (err.name === "ZodError") {
        const errors = err.errors.reduce((acc: any, error: any) => {
          acc[error.path.join(".")] = error.message;
          return acc;
        }, {});
        errorResponse(res, "Validation failed", 400, errors);
        return;
      }
      errorResponse(res, err.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/persons/{id}:
   *   put:
   *     tags: [Persons]
   *     summary: Actualizar datos de una persona
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Persona actualizada
   */
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const body = updatePersonBodySchema.parse(req.body);
      const companyId = req.companyId ?? null;
      const person = await this.service.updatePerson(id, body, companyId);
      successResponse(res, person);
    } catch (err: any) {
      if (err.name === "ZodError") {
        const errors = err.errors.reduce((acc: any, error: any) => {
          acc[error.path.join(".")] = error.message;
          return acc;
        }, {});
        errorResponse(res, "Validation failed", 400, errors);
        return;
      }
      errorResponse(res, err.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/persons:
   *   get:
   *     tags: [Persons]
   *     summary: Obtener lista paginada de personas
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de personas
   */
  async list(req: Request, res: Response) {
    try {
      const query = getPersonsQuerySchema.parse(req.query);
      const companyId = req.companyId ?? null;
      const { data, metadata } = await this.service.getPersons(query, companyId);
      paginatedResponse(res, data, metadata);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/persons/search:
   *   get:
   *     tags: [Persons]
   *     summary: Buscar personas por nombre, email o teléfono
   *     parameters:
   *       - in: query
   *         name: search
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  async search(req: Request, res: Response) {
    try {
      const query = searchPersonsQuerySchema.parse(req.query);
      const companyId = req.companyId ?? null;
      const persons = await this.service.searchPersons(query, companyId);
      successResponse(res, persons);
    } catch (err: any) {
      if (err.name === "ZodError") {
        errorResponse(res, "El término de búsqueda es requerido", 400);
        return;
      }
      errorResponse(res, err.message, 400);
    }
  }

  /**
   * @openapi
   * /v1/persons/{id}:
   *   delete:
   *     tags: [Persons]
   *     summary: Eliminar una persona (soft delete)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Persona eliminada
   */
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const companyId = req.companyId ?? null;
      const result = await this.service.deletePerson(id, companyId);
      successResponse(res, result);
    } catch (err: any) {
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }

  /**
   * @openapi
   * /v1/persons/{id}/properties/{propertyId}:
   *   post:
   *     tags: [Persons]
   *     summary: Vincular una persona a una propiedad con un rol
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *       - in: path
   *         name: propertyId
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [owner, tenant]
   *     responses:
   *       200:
   *         description: Vinculación exitosa
   */
  async assignProperty(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id);
      const propertyId = Number(req.params.propertyId);

      if (isNaN(personId) || isNaN(propertyId)) {
        errorResponse(res, "IDs inválidos", 400);
        return;
      }

      const body = assignPropertyBodySchema.parse(req.body);
      const companyId = req.companyId ?? null;
      const result = await this.service.assignPropertyToPerson(
        personId,
        propertyId,
        body.role,
        companyId
      );
      successResponse(res, result);
    } catch (err: any) {
      if (err.name === "ZodError") {
        errorResponse(res, err.errors[0].message, 400);
        return;
      }
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }

  async unassignProperty(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id);
      const propertyId = Number(req.params.propertyId);

      if (isNaN(personId) || isNaN(propertyId)) {
        errorResponse(res, "IDs inválidos", 400);
        return;
      }

      const body = unassignPropertyBodySchema.parse(req.body);
      const companyId = req.companyId ?? null;
      const result = await this.service.unassignPropertyFromPerson(
        personId,
        propertyId,
        body.role,
        companyId
      );
      successResponse(res, result);
    } catch (err: any) {
      if (err.name === "ZodError") {
        errorResponse(res, err.errors[0].message, 400);
        return;
      }
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }

  /**
   * @openapi
   * /v1/persons/{id}/relations:
   *   get:
   *     tags: [Persons]
   *     summary: Obtener relaciones de una persona con propiedades
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Relaciones de la persona
   */
  async getRelations(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const companyId = req.companyId ?? null;
      const relations = await this.service.getPersonRelations(id, companyId);
      successResponse(res, relations);
    } catch (err: any) {
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }
}
