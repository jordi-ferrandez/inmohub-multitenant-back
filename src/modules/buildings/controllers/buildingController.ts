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
} from "../types/buildingTypes";

export class BuildingController {
  BuildingService = new BuildingService();

  async getBuildingsGroupedByStreets(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const buildings =
        await this.BuildingService.getBuildingsGroupedByStreets();
      successResponse(res, buildings, 200);
      return;
    } catch (error: any) {
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
      const { data, meta } = await this.BuildingService.getBuildings(query);
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
      const { data, meta } =
        await this.BuildingService.getBuildingsByStreetName(params, query);
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
      const data = await this.BuildingService.getBuildingById(params);
      successResponse(res, data, 200);
    } catch (error: any) {
      errorResponse(
        res,
        error.message ||
          `Error al obtener el edificio cons ID ${req.paramsValidated.id}`,
        500
      );
    }
  }

  async getBuildingMailboxings(req: Request, res: Response): Promise<void> {
    try {
      const params = req.paramsValidated as GetBuildingMailboxingsParams;
      const query = req.queryValidated as GetBuildingMailboxingsQuery;
      const result = await this.BuildingService.getBuildingMailboxings(
        params,
        query
      );
      // Mapear la paginación de MailboxingListResponse a PaginationMetadata
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
}
