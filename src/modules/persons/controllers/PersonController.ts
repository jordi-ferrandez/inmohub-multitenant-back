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

  async create(req: Request, res: Response) {
    try {
      const body = createPersonBodySchema.parse(req.body);
      const person = await this.service.createPerson(body);
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

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const body = updatePersonBodySchema.parse(req.body);
      const person = await this.service.updatePerson(id, body);
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

  async list(req: Request, res: Response) {
    try {
      const query = getPersonsQuerySchema.parse(req.query);
      const { data, metadata } = await this.service.getPersons(query);
      paginatedResponse(res, data, metadata);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  async search(req: Request, res: Response) {
    try {
      console.log('aquiiiiii ' + JSON.stringify(req.query));
      const query = searchPersonsQuerySchema.parse(req.query);
      const persons = await this.service.searchPersons(query);
      successResponse(res, persons);
    } catch (err: any) {
      if (err.name === "ZodError") {
        errorResponse(res, "El término de búsqueda es requerido", 400);
        return;
      }
      errorResponse(res, err.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const result = await this.service.deletePerson(id);
      successResponse(res, result);
    } catch (err: any) {
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }

  async assignProperty(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id);
      const propertyId = Number(req.params.propertyId);

      if (isNaN(personId) || isNaN(propertyId)) {
        errorResponse(res, "IDs inválidos", 400);
        return;
      }

      const body = assignPropertyBodySchema.parse(req.body);
      const result = await this.service.assignPropertyToPerson(
        personId,
        propertyId,
        body.role
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
      const result = await this.service.unassignPropertyFromPerson(
        personId,
        propertyId,
        body.role
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

  async getRelations(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        errorResponse(res, "ID inválido", 400);
        return;
      }

      const relations = await this.service.getPersonRelations(id);
      successResponse(res, relations);
    } catch (err: any) {
      const statusCode = err.message.includes("no encontrada") ? 404 : 400;
      errorResponse(res, err.message, statusCode);
    }
  }
}
