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
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdateUserPasswordRequest,
} from "../types";
import { AuthService } from "../services";
import { errorResponse, successResponse, paginatedResponse } from "@core/utils";

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @openapi
   * /v1/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Registrar un nuevo usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Usuario creado exitosamente
   *       400:
   *         description: Error en los datos proporcionados
   */
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

  /**
   * @openapi
   * /v1/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Iniciar sesión en el sistema
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login exitoso, devuelve JWT
   *       401:
   *         description: Credenciales inválidas
   */
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

  /**
   * @openapi
   * /v1/auth/users:
   *   post:
   *     tags: [Auth]
   *     summary: Crear un nuevo usuario
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Usuario creado
   */
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

  /**
   * @openapi
   * /v1/auth/users/{id}:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener detalles de un usuario por ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Detalles del usuario
   */
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

  /**
   * @openapi
   * /v1/auth/users/{id}:
   *   put:
   *     tags: [Auth]
   *     summary: Actualizar datos de un usuario
   *     security:
   *       - bearerAuth: []
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
   *         description: Usuario actualizado
   */
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

  /**
   * @openapi
   * /v1/auth/roles:
   *   get:
   *     tags: [Auth]
   *     summary: Obtener todos los roles disponibles
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de roles
   */
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

  async forgotPassword(
    req: Request<{}, {}, ForgotPasswordRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.bodyValidated;
      await this.authService.forgotPassword(email);
      successResponse(
        res,
        { message: "Si el email existe, se ha enviado un enlace de recuperación" },
        200
      );
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al solicitar recuperación", 400);
      return;
    }
  }

  async resetPassword(
    req: Request<{}, {}, ResetPasswordRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const resetData = req.bodyValidated;
      await this.authService.resetPassword(resetData);
      successResponse(res, { message: "Contraseña actualizada correctamente" }, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al restablecer contraseña", 400);
      return;
    }
  }

  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.query as { token: string };
      if (!token) {
        throw new Error("Token es requerido");
      }
      await this.authService.verifyEmail(token);
      successResponse(res, { message: "Email verificado correctamente" }, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al verificar email", 400);
      return;
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.bodyValidated;
      const userId = (req as any).user.userId; // Assuming user is injected by auth middleware
      await this.authService.changePassword(userId, oldPassword, newPassword);
      successResponse(res, { message: "Contraseña cambiada correctamente" }, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al cambiar contraseña", 400);
      return;
    }
  }
  async updateMe(
    req: Request<{}, {}, UpdateProfileRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const profileData = req.bodyValidated;
      const updatedProfile = await this.authService.updateProfile(
        userId,
        profileData
      );
      successResponse(res, updatedProfile, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al actualizar perfil", 400);
      return;
    }
  }

  async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const profile = await this.authService.getProfile(userId);
      successResponse(res, profile, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al obtener perfil", 400);
      return;
    }
  }

  /**
   * @openapi
   * /v1/auth/onboarding:
   *   patch:
   *     tags: [Auth]
   *     summary: Marcar un tour de onboarding como completado
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               tourId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Estado actualizado
   */
  async completeOnboarding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { tourId } = req.body;
      if (!tourId) {
        throw new Error("tourId es requerido");
      }
      const updatedUser = await this.authService.updateOnboardingStatus(
        userId,
        tourId
      );
      successResponse(res, updatedUser, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al completar onboarding", 400);
      return;
    }
  }

  async resetOnboarding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as any;
      const updatedUser = await this.authService.resetOnboardingStatus(
        parseInt(params.id)
      );
      successResponse(res, updatedUser, 200);
      return;
    } catch (error: any) {
      errorResponse(res, error.message || "Error al resetear onboarding", 400);
      return;
    }
  }

  async updateUserPassword(
    req: Request<{ id: string }, {}, UpdateUserPasswordRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const requesterIdStr = req.user?.userId;
      if (!requesterIdStr) {
        errorResponse(res, "Usuario no autenticado", 401);
        return;
      }

      const requesterId = parseInt(requesterIdStr, 10);
      if (isNaN(requesterId)) {
        errorResponse(res, "ID de usuario inválido", 400);
        return;
      }

      const params = req.paramsValidated as UserParams;
      const userId = parseInt(params.id, 10);
      const passwordData = req.bodyValidated as UpdateUserPasswordRequest;

      await this.authService.updateUserPassword(
        userId,
        passwordData,
        requesterId
      );
      successResponse(
        res,
        { message: "Contraseña actualizada correctamente" },
        200
      );
      return;
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al actualizar contraseña",
        400
      );
      return;
    }
  }

  async sendResetPasswordLink(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.paramsValidated as UserParams;
      await this.authService.sendResetPasswordLink(parseInt(params.id));
      successResponse(
        res,
        { message: "Enlace de restablecimiento enviado correctamente" },
        200
      );
      return;
    } catch (error: any) {
      errorResponse(
        res,
        error.message || "Error al enviar enlace de restablecimiento",
        400
      );
      return;
    }
  }
}

export { AuthController };
