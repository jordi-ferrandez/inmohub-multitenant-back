import { prisma } from "@core/lib";

/**
 * Configuración de permisos para edición y borrado de seguimientos
 *
 * Esta configuración permite flexibilidad para futuros cambios:
 * - Por defecto: todos los usuarios autenticados pueden editar/borrar
 * - Futuro: se puede restringir por rol o por creador
 */
export interface FollowUpPermissionConfig {
  // Roles permitidos para editar (undefined = todos los usuarios autenticados)
  allowedRolesForEdit?: string[];
  // Roles permitidos para borrar (undefined = todos los usuarios autenticados)
  allowedRolesForDelete?: string[];
  // Si solo el creador puede editar (false por defecto)
  onlyCreatorCanEdit?: boolean;
  // Si solo el creador puede borrar (false por defecto)
  onlyCreatorCanDelete?: boolean;
  // Si el creador siempre puede editar/borrar incluso si no tiene el rol requerido
  creatorAlwaysAllowed?: boolean;
}

// Configuración actual: todos los usuarios autenticados pueden editar/borrar
const PERMISSION_CONFIG: FollowUpPermissionConfig = {
  allowedRolesForEdit: undefined, // undefined = todos los usuarios autenticados
  allowedRolesForDelete: undefined, // undefined = todos los usuarios autenticados
  onlyCreatorCanEdit: false,
  onlyCreatorCanDelete: false,
  creatorAlwaysAllowed: true, // El creador siempre puede editar/borrar
};

/**
 * Verifica si un usuario puede editar un seguimiento
 */
export async function canEditFollowUp(
  followUpId: number,
  userId: number
): Promise<boolean> {
  const followUp = await prisma.followUp.findUnique({
    where: { id: followUpId },
    select: { sellerId: true, deletedAt: true },
  });

  if (!followUp || followUp.deletedAt) {
    return false;
  }

  const isCreator = followUp.sellerId === userId;

  // Si solo el creador puede editar
  if (PERMISSION_CONFIG.onlyCreatorCanEdit) {
    return isCreator;
  }

  // Si el creador siempre está permitido
  if (PERMISSION_CONFIG.creatorAlwaysAllowed && isCreator) {
    return true;
  }

  // Si hay roles específicos permitidos
  if (PERMISSION_CONFIG.allowedRolesForEdit) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
          where: { deletedAt: null },
        },
      },
    });

    if (!user) return false;

    const userRoleNames = user.roles.map((ur) => ur.role.name);
    const hasAllowedRole = PERMISSION_CONFIG.allowedRolesForEdit.some((role) =>
      userRoleNames.includes(role)
    );

    return hasAllowedRole;
  }

  // Por defecto: todos los usuarios autenticados pueden editar
  return true;
}

/**
 * Verifica si un usuario puede borrar un seguimiento
 */
export async function canDeleteFollowUp(
  followUpId: number,
  userId: number
): Promise<boolean> {
  const followUp = await prisma.followUp.findUnique({
    where: { id: followUpId },
    select: { sellerId: true, deletedAt: true },
  });

  if (!followUp || followUp.deletedAt) {
    return false;
  }

  const isCreator = followUp.sellerId === userId;

  // Si solo el creador puede borrar
  if (PERMISSION_CONFIG.onlyCreatorCanDelete) {
    return isCreator;
  }

  // Si el creador siempre está permitido
  if (PERMISSION_CONFIG.creatorAlwaysAllowed && isCreator) {
    return true;
  }

  // Si hay roles específicos permitidos
  if (PERMISSION_CONFIG.allowedRolesForDelete) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
          where: { deletedAt: null },
        },
      },
    });

    if (!user) return false;

    const userRoleNames = user.roles.map((ur) => ur.role.name);
    const hasAllowedRole = PERMISSION_CONFIG.allowedRolesForDelete.some(
      (role) => userRoleNames.includes(role)
    );

    return hasAllowedRole;
  }

  // Por defecto: todos los usuarios autenticados pueden borrar
  return true;
}

/**
 * Obtiene la configuración actual de permisos (útil para debugging o frontend)
 */
export function getPermissionConfig(): FollowUpPermissionConfig {
  return { ...PERMISSION_CONFIG };
}

/**
 * Actualiza la configuración de permisos (útil para futuras extensiones)
 * NOTA: En producción, esto podría leerse de variables de entorno o base de datos
 */
export function updatePermissionConfig(
  config: Partial<FollowUpPermissionConfig>
): void {
  Object.assign(PERMISSION_CONFIG, config);
}
