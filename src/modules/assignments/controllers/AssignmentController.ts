import { Request, Response } from "express";
import { assignmentService } from "../services";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentQueryParams,
  AssignmentParams,
} from "../types";
import { successResponse, errorResponse } from "@core/utils";

class AssignmentController {
  async createAssignment(req: Request, res: Response) {
    try {
      const assignment = await assignmentService.createAssignment(
        req.bodyValidated
      );
      successResponse(res, assignment, 201);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async getAssignments(req: Request, res: Response) {
    try {
      const result = await assignmentService.getAssignments(req.queryValidated);
      successResponse(res, result, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getAssignmentById(req: Request<AssignmentParams>, res: Response) {
    try {
      const id = parseInt(req.paramsValidated.id);
      const assignment = await assignmentService.getAssignmentById(id);
      successResponse(res, assignment, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  async updateAssignment(
    req: Request<AssignmentParams, {}, UpdateAssignmentRequest>,
    res: Response
  ) {
    try {
      const id = parseInt(req.paramsValidated.id);
      const assignment = await assignmentService.updateAssignment(
        id,
        req.bodyValidated
      );
      successResponse(res, assignment, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 400);
    }
  }

  async deleteAssignment(req: Request<AssignmentParams>, res: Response) {
    try {
      const id = parseInt(req.paramsValidated.id);
      await assignmentService.deleteAssignment(id);
      successResponse(res, null, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 404);
    }
  }

  async getAssignmentsByUser(req: Request<{ userId: string }>, res: Response) {
    try {
      const userId = parseInt(req.paramsValidated.userId);
      const assignments = await assignmentService.getAssignmentsByUser(userId);
      successResponse(res, assignments, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getAssignmentsByBuilding(
    req: Request<{ buildingId: string }, any, any, { activeOnly?: string }>,
    res: Response
  ) {
    try {
      const buildingId = parseInt(req.params.buildingId);
      if (isNaN(buildingId)) {
        errorResponse(res, "ID de edificio inválido", 400);
        return;
      }

      // Verificar si se solicita solo asignaciones activas
      const activeOnly = req.query.activeOnly === "true";

      const assignments = await assignmentService.getAssignmentsByBuilding(
        buildingId,
        activeOnly
      );
      successResponse(res, assignments, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }

  async getAssignmentsSummary(req: Request, res: Response) {
    try {
      const summary = await assignmentService.getAssignmentsSummary();
      successResponse(res, summary, 200);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

export const assignmentController = new AssignmentController();
