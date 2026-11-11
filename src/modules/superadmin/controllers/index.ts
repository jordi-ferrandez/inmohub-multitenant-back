import { Request, Response } from "express";
import { successResponse, paginatedResponse, errorResponse } from "@core/utils";
import { superadminCompanyService } from "../services/SuperadminCompanyService";
import { superadminUserService } from "../services/SuperadminUserService";
import { bindAllMethods } from "@core/utils";

class CompanyController {
  async create(req: Request, res: Response) {
    try {
      const company = await superadminCompanyService.createCompany(req.bodyValidated);
      successResponse(res, company, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear empresa", 400);
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const companies = await superadminCompanyService.getAllCompanies();
      successResponse(res, companies);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener empresas", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const company = await superadminCompanyService.getCompanyById(id);
      if (!company) {
        errorResponse(res, "Empresa no encontrada", 404);
        return;
      }
      successResponse(res, company);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener empresa", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const company = await superadminCompanyService.updateCompany(id, req.bodyValidated);
      successResponse(res, company);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar empresa", 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await superadminCompanyService.deleteCompany(id);
      successResponse(res, { message: "Empresa eliminada correctamente" });
    } catch (error: any) {
      errorResponse(res, error.message || "Error al eliminar empresa", 400);
    }
  }
}

class SuperadminUserController {
  async getAll(req: Request, res: Response) {
    try {
      const result = await superadminUserService.getUsers({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: req.query.search as string,
        companyId: req.query.companyId ? Number(req.query.companyId) : undefined,
        role: req.query.role as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      });
      paginatedResponse(res, result.users, { totalItems: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages });
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener usuarios", 500);
    }
  }

  async moveUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const { companyId } = req.bodyValidated;
      await superadminUserService.moveUserToCompany(userId, companyId);
      successResponse(res, { message: "Usuario movido correctamente" });
    } catch (error: any) {
      errorResponse(res, error.message || "Error al mover usuario", 400);
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const user = await superadminUserService.createUser(req.bodyValidated);
      successResponse(res, user, 201);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear usuario", 400);
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        errorResponse(res, "ID de usuario inválido", 400);
        return;
      }
      // El usuario autenticado (para protecciones de autobloqueo)
      const currentUserId = (req.user as any)?.userId as number;
      const user = await superadminUserService.updateUser(
        id,
        req.bodyValidated,
        currentUserId
      );
      successResponse(res, user);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar usuario", 400);
    }
  }

  async getRoles(req: Request, res: Response) {
    try {
      const companyId = req.query.companyId
        ? Number(req.query.companyId)
        : undefined;
      const roles = await superadminUserService.getRoles(companyId);
      successResponse(res, roles);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener roles", 500);
    }
  }
}

class SuperadminStatsController {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await superadminUserService.getStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener estadísticas", 500);
    }
  }
}

const companyController = bindAllMethods(new CompanyController());
const superadminUserController = bindAllMethods(new SuperadminUserController());
const superadminStatsController = bindAllMethods(new SuperadminStatsController());

export { companyController, superadminUserController, superadminStatsController };
