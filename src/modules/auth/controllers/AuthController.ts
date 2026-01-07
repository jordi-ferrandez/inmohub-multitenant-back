import { NextFunction, Request, Response } from "express";
import {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRolesRequest,
  UserQueryParams,
  UserParams,
} from "../types";
import { AuthService } from "../services";
import { errorResponse, successResponse, paginatedResponse } from "@core/utils";

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(
    req: Request<{}, {}, RegisterRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData = req.bodyValidated;
      const newUser: RegisterResponse = await this.authService.registerUser(
        userData
      );
      successResponse(res, newUser, 201);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al registrar usuario", 400);
      return;
    }
  }

  async login(
    req: Request<{}, {}, LoginRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const loginData = req.bodyValidated;
      const loginResponse = await this.authService.loginUser(loginData);
      successResponse(res, loginResponse, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al iniciar sesión", 400);
      return;
    }
  }

  // Nuevos métodos CRUD para gestión de usuarios

  async createUser(
    req: Request<{}, {}, CreateUserRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData = req.bodyValidated;
      const newUser = await this.authService.createUser(userData);
      successResponse(res, newUser, 201);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al crear usuario", 400);
      return;
    }
  }

  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.queryValidated as UserQueryParams;
      const result = await this.authService.getUsers(query);
      paginatedResponse(
        res,
        result.users,
        {
          totalItems: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        200
      );
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener usuarios", 500);
      return;
    }
  }

  async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const search = req.query.search as string;
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive
        ? req.query.isActive === "true"
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      if (!search || search.trim().length === 0) {
        successResponse(res, [], 200);
        return;
      }

      const users = await this.authService.searchUsers({
        search: search.trim(),
        role,
        isActive,
        limit,
      });
      successResponse(res, users, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al buscar usuarios", 500);
      return;
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.paramsValidated as UserParams;
      const user = await this.authService.getUserById(parseInt(params.id));
      successResponse(res, user, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener usuario", 404);
      return;
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.paramsValidated as UserParams;
      const userData = req.bodyValidated as UpdateUserRequest;
      const updatedUser = await this.authService.updateUser(
        parseInt(params.id),
        userData
      );
      successResponse(res, updatedUser, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar usuario", 400);
      return;
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.paramsValidated as UserParams;
      await this.authService.deleteUser(parseInt(params.id));
      successResponse(res, { message: "Usuario eliminado correctamente" }, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al eliminar usuario", 400);
      return;
    }
  }

  async updateUserRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.paramsValidated as UserParams;
      const rolesData = req.bodyValidated as UpdateUserRolesRequest;
      const updatedUser = await this.authService.updateUserRoles(
        parseInt(params.id),
        rolesData.roleIds
      );
      successResponse(res, updatedUser, 200);
      return;
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al actualizar roles del usuario",
        400
      );
      return;
    }
  }

  async getAllRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const roles = await this.authService.getAllRoles();
      successResponse(res, roles, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener roles", 400);
      return;
    }
  }
}

export { AuthController };
