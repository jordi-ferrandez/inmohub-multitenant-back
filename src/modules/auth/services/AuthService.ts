import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@core/lib";
import { getEnvironmentVariables } from "@core/utils";
import { MailerService } from "@core/services";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserManagementDTO,
  UserListResponse,
  UserQueryParams,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from "../types";

const SALT_ROUNDS = getEnvironmentVariables().SALT_ROUNDS;
const JWT_SECRET = getEnvironmentVariables().JWT_SECRET;

class AuthService {
  private mailerService: MailerService;

  constructor() {
    this.mailerService = new MailerService();
  }
  async registerUser(input: RegisterRequest): Promise<RegisterResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const userRole = await prisma.role.findUnique({
      where: { name: input.role },
    });

    if (!userRole) {
      throw new Error("Rol de usuario no configurado en el sistema");
    }

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          verificationToken,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });

      return user;
    });

    // Enviar correo de bienvenida con verificación después de la transacción exitosa
    await this.mailerService.sendWelcomeEmail(
      newUser.email,
      `${newUser.firstName} ${newUser.lastName}`,
      verificationToken
    );

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      roles: [userRole.name],
      createdAt: newUser.createdAt,
    };
  }

  async loginUser(input: LoginRequest): Promise<LoginResponse> {
    const { email, password } = input;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!JWT_SECRET) throw new Error("JWT_SECRET no definido");
    if (!user) {
      throw new Error("Credenciales inválidas");
    }
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Credenciales inválidas");
    }

    //descomentar si se implementa verificacion de correo

    // if (!user.emailVerified) {
    //   throw new Error("Debes verificar tu email antes de iniciar sesión. Por favor, revisa tu correo.");
    // }

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: user.id,
        deletedAt: null, // Solo roles activos del usuario
      },
      include: {
        role: {
          select: {
            id: true,
            displayName: true,
            name: true,
            deletedAt: true, // Incluir para filtrar después
          },
        },
      },
    });
    // Filtrar roles que no están eliminados y mapear a formato esperado
    const roles = userRoles
      .filter((ur) => ur.role && ur.role.deletedAt === null) // Solo roles activos
      .map((ur) => ({
        id: ur.role.id,
        displayName: String(ur.role.displayName),
        name: String(ur.role.name),
      }));

    const payload = {
      userId: user.id,
      email: user.email,
      roles: roles,
      completedTours: user.completedTours || [],
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: "1d",
    });

    return { token };
  }

  // Nuevos métodos CRUD para gestión de usuarios

  async createUser(input: CreateUserRequest): Promise<UserManagementDTO> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);

    const userRole = await prisma.role.findUnique({
      where: { name: input.role },
    });

    if (!userRole) {
      throw new Error("Rol de usuario no configurado en el sistema");
    }

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          isActive: input.isActive ?? true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });

      return user;
    });

    return this.mapUserToDTO(newUser, [userRole]);
  }

  async getUsers(query: UserQueryParams): Promise<UserListResponse> {
    // Asegurar valores por defecto explícitamente
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search;
    const role = query.role;
    const isActive = query.isActive;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    // Construir ordenamiento
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          roles: {
            where: {
              deletedAt: null, // Solo UserRole activos (no eliminados)
            },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  deletedAt: true, // Incluir para filtrar después
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const userDTOs = users.map((user) => {
      // Filtrar roles eliminados antes de mapear
      const activeUserRoles = user.roles.filter(
        (ur) => ur.role && !ur.role.deletedAt
      );
      return this.mapUserToDTO(
        user,
        activeUserRoles.map((ur) => ur.role)
      );
    });

    return {
      users: userDTOs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchUsers(query: {
    search: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<UserManagementDTO[]> {
    const limit = query.limit ?? 20; // Límite por defecto más pequeño para búsqueda rápida

    const where: any = {
      deletedAt: null,
    };

    // Búsqueda optimizada con OR en firstName, lastName, email
    if (query.search && query.search.trim().length > 0) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.role) {
      where.roles = {
        some: {
          role: {
            name: query.role,
          },
        },
      };
    }

    // Query optimizada: solo campos necesarios, sin paginación completa
    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        completedTours: true,
        roles: {
          where: {
            deletedAt: null,
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                deletedAt: true, // Incluir para filtrar después
              },
            },
          },
        },
      },
    });

    return users.map((user) => {
      // Filtrar roles eliminados antes de mapear
      const activeUserRoles = user.roles.filter(
        (ur) => ur.role && !ur.role.deletedAt
      );
      return this.mapUserToDTO(
        user as any,
        activeUserRoles.map((ur) => ur.role)
      );
    });
  }

  async getUserById(id: number): Promise<UserManagementDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          where: {
            deletedAt: null, // Solo UserRole activos
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                deletedAt: true, // Incluir para filtrar después
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Filtrar roles eliminados antes de mapear
    const activeUserRoles = user.roles.filter(
      (ur) => ur.role && ur.role.deletedAt === null
    );
    return this.mapUserToDTO(
      user,
      activeUserRoles.map((ur) => ur.role!)
    );
  }

  async updateUser(
    id: number,
    input: UpdateUserRequest
  ): Promise<UserManagementDTO> {
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar email único si se está actualizando
    if (input.email && input.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (emailExists) {
        throw new Error("El email ya está registrado");
      }
    }

    const oldEmail = existingUser.email;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
        isActive: input.isActive,
      },
      include: {
        roles: {
          where: {
            deletedAt: null, // Solo UserRole activos
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                deletedAt: true, // Incluir para filtrar después
              },
            },
          },
        },
      },
    });

    // Si el email cambió, notificar a amboscorreos
    if (input.email && input.email !== oldEmail) {
      this.mailerService.sendEmailChangedNotification(
        oldEmail,
        existingUser.firstName,
        oldEmail,
        input.email
      );
      this.mailerService.sendEmailChangedNotification(
        input.email,
        existingUser.firstName,
        oldEmail,
        input.email
      );
    }

    // Filtrar roles eliminados antes de mapear
    const activeUserRoles = updatedUser.roles.filter(
      (ur) => ur.role && !ur.role.deletedAt
    );
    return this.mapUserToDTO(
      updatedUser,
      activeUserRoles.map((ur) => ur.role)
    );
  }

  async deleteUser(id: number): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async updateUserRoles(
    id: number,
    roleIds: number[]
  ): Promise<UserManagementDTO> {
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    // Eliminar duplicados de roleIds
    const uniqueRoleIds = Array.from(new Set(roleIds));

    if (uniqueRoleIds.length === 0) {
      throw new Error("Debe proporcionar al menos un rol");
    }

    // Verificar que todos los roles existen
    const roles = await prisma.role.findMany({
      where: {
        id: { in: uniqueRoleIds },
        deletedAt: null,
      },
    });

    if (roles.length !== uniqueRoleIds.length) {
      throw new Error("Uno o más roles no existen o están eliminados");
    }

    // Actualizar roles en transacción
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Obtener todos los roles actuales del usuario (incluyendo eliminados)
      const currentUserRoles = await tx.userRole.findMany({
        where: {
          userId: id,
        },
      });

      // Crear un mapa de roles actuales por roleId
      const currentRolesMap = new Map(
        currentUserRoles.map((ur) => [ur.roleId, ur])
      );

      // Soft delete de roles que NO están en la nueva lista
      const rolesToDelete = currentUserRoles.filter(
        (ur) => !uniqueRoleIds.includes(ur.roleId)
      );

      if (rolesToDelete.length > 0) {
        await tx.userRole.updateMany({
          where: {
            userId: id,
            roleId: { in: rolesToDelete.map((ur) => ur.roleId) },
            deletedAt: null, // Solo eliminar los que no están eliminados
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      // Crear nuevos roles o reactivar existentes
      for (const roleId of uniqueRoleIds) {
        const existingUserRole = currentRolesMap.get(roleId);

        if (existingUserRole) {
          // Si existe pero está eliminado, reactivarlo
          if (existingUserRole.deletedAt !== null) {
            await tx.userRole.update({
              where: {
                userId_roleId: {
                  userId: id,
                  roleId: roleId,
                },
              },
              data: {
                deletedAt: null,
                updatedAt: new Date(),
              },
            });
          }
          // Si ya existe y no está eliminado, no hacer nada
        } else {
          // Crear nuevo rol
          await tx.userRole.create({
            data: {
              userId: id,
              roleId: roleId,
            },
          });
        }
      }

      // Obtener usuario actualizado con roles
      return await tx.user.findUnique({
        where: { id },
        include: {
          roles: {
            where: {
              deletedAt: null,
            },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    });

    if (!updatedUser) {
      throw new Error("Error al actualizar roles del usuario");
    }

    return this.mapUserToDTO(
      updatedUser,
      updatedUser.roles.map((ur) => ur.role)
    );
  }

  async getAllRoles(): Promise<
    Array<{ id: number; name: string; displayName: string }>
  > {
    const roles = await prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    });

    // Ordenar por jerarquía: Director, Responsible, Agent, Mailboxer
    const hierarchy = ["Director", "Responsible", "Agent", "Mailboxer"];
    const sortedRoles = roles.sort((a, b) => {
      const indexA = hierarchy.indexOf(a.name);
      const indexB = hierarchy.indexOf(b.name);
      
      // Si un rol no está en la jerarquía, ponerlo al final
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });

    return sortedRoles;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists. Just return success.
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await this.mailerService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    );
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: input.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Token inválido o expirado");
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await this.mailerService.sendPasswordChangedNotification(
      user.email,
      user.firstName
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      throw new Error("Token de verificación inválido");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const isPasswordValid = await compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("La contraseña actual es incorrecta");
    }

    const passwordHash = await hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.mailerService.sendPasswordChangedNotification(
      user.email,
      user.firstName
    );
  }

  async getProfile(userId: number): Promise<UserManagementDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return this.mapUserToDTO(
      user,
      user.roles.map((ur) => ur.role)
    );
  }

  async updateProfile(
    userId: number,
    data: UpdateProfileRequest
  ): Promise<UserManagementDTO> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error("El email ya está registrado");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    // Si el email cambió, podríamos querer invalidar la verificación actual
    // Pero por ahora, seguiremos la lógica del usuario de no forzarla inmediatamente si no se solicita.

    return this.mapUserToDTO(
      updatedUser,
      updatedUser.roles.map((ur) => ur.role)
    );
  }

  async updateOnboardingStatus(
    userId: number,
    tourId: string
  ): Promise<UserManagementDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { completedTours: true },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.completedTours.includes(tourId)) {
      return this.getUserById(userId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        completedTours: [...user.completedTours, tourId],
      },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Onboarding completed for user ${userId}: ${tourId}`);
    }

    return this.mapUserToDTO(
      updatedUser,
      updatedUser.roles.map((ur) => ur.role)
    );
  }

  async resetOnboardingStatus(
    userId: number
  ): Promise<UserManagementDTO> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        completedTours: [],
      },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    return this.mapUserToDTO(
      updatedUser,
      updatedUser.roles.map((ur) => ur.role)
    );
  }

  private mapUserToDTO(user: any, roles: any[]): UserManagementDTO {
    // Filtrar roles eliminados (deletedAt !== null) y eliminar duplicados por ID
    const activeRoles = roles.filter((role) => !role.deletedAt);
    const uniqueRoles = Array.from(
      new Map(activeRoles.map((role) => [role.id, role])).values()
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      roles: uniqueRoles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      completedTours: user.completedTours || [],
    };
  }
}

export { AuthService };
