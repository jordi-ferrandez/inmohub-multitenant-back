import { errorResponse, paginatedResponse, successResponse } from "@core/utils";
import { Request, Response } from "express";
import { BuildingService } from "../services";
import {
  GetBuildingByIdParams,
  GetBuildingsByStreetNameParams,
  GetBuildingsByStreetNameQuery,
  GetBuildingsQuery,
  GetBuildingMailboxingsParams,
  GetBuildingMailboxingsQuery,
  DeleteBuildingParams,
  CreateBuildingDTO,
  UpdateBuildingDTO,
} from "../types/buildingTypes";

export class BuildingController {
  BuildingService = new BuildingService();

  async getBuildingsGroupedByStreets(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const cursorId = req.query.cursorId;
      const companyId = req.companyId ?? null;

      const buildings =
        await this.BuildingService.getBuildingsGroupedByStreets(cursorId, companyId);

      successResponse(res, buildings, 200);

      return;
    } catch (error: any) {
      console.error("Error in getBuildingsGroupedByStreets:", error);
      errorResponse(
        res,
        error.message || "Error al obtener los edificios agrupados",
        500
      );
      return;
    }
  }

  async getBuildings(req: Request, res: Response): Promise<void> {
    try {
      const query = req.queryValidated as GetBuildingsQuery;
      const companyId = req.companyId ?? null;
      const { data, meta } = await this.BuildingService.getBuildings(query, companyId);
      paginatedResponse(res, data, meta, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al obtener los edificios",
        500
      );
    }
  }

  async getBuildingsByStreetName(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as GetBuildingsByStreetNameParams;
      const query = req.queryValidated as GetBuildingsByStreetNameQuery;
      const companyId = req.companyId ?? null;
      const { data, meta } =
        await this.BuildingService.getBuildingsByStreetName(params, query, companyId);
      paginatedResponse(res, data, meta, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al obtener los edificios",
        500
      );
    }
  }

  async getBuildingById(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as GetBuildingByIdParams;
      const companyId = req.companyId ?? null;
      const data = await this.BuildingService.getBuildingById(params, companyId);
      successResponse(res, data, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message ||
          `Error al obtener el edificio con ID ${req.paramsValidated.id}`,
        500
      );
    }
  }

  async createBuilding(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as CreateBuildingDTO;
      const companyId = req.companyId ?? null;
      const building = await this.BuildingService.createBuilding(data, companyId);
      successResponse(res, building, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear edificio", 500);
    }
  }

  async updateBuilding(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = req.body as UpdateBuildingDTO;
      const companyId = req.companyId ?? null;
      const building = await this.BuildingService.updateBuilding(id, data, companyId);
      successResponse(res, building, 200);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar edificio", 500);
    }
  }

  async getBuildingMailboxings(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as GetBuildingMailboxingsParams;
      const query = req.queryValidated as GetBuildingMailboxingsQuery;
      const companyId = req.companyId ?? null;
      const result = await this.BuildingService.getBuildingMailboxings(
        params,
        query,
        companyId
      );
      const paginationMetadata = {
        totalItems: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
      paginatedResponse(res, result.data, paginationMetadata, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message ||
          `Error al obtener los buzoneos del edificio ${req.paramsValidated.id}`,
        500
      );
    }
  }

  async getDeletionSummary(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as DeleteBuildingParams;
      const companyId = req.companyId ?? null;
      const summary = await this.BuildingService.getDeletionSummary(params, companyId);
      successResponse(res, summary, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al obtener el resumen de eliminación",
        500
      );
    }
  }

  async deleteBuilding(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as DeleteBuildingParams;
      const companyId = req.companyId ?? null;
      await this.BuildingService.deleteBuilding(params, companyId);
      successResponse(
        res,
        { message: "Edificio eliminado correctamente" },
        200
      );
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al eliminar el edificio",
        500
      );
    }
  }
}
