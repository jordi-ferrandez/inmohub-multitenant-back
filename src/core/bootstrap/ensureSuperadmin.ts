import bcrypt from "bcryptjs";
import { prisma } from "@core/lib/prisma";
import { envConfig } from "@core/config/env";

/**
 * Tarea de arranque: se asegura de que exista un Superadmin en la base de datos.
 *
 * Comportamiento:
 * 1. Busca el usuario por el email configurado (SUPERADMIN_EMAIL, por defecto
 *    "superadmin@inmohub.com").
 * 2. Si existe pero no tiene el flag `isSuperAdmin` (o está desactivado),
 *    lo promueve/reactiva. NUNCA resetea su contraseña, respeta los cambios
 *    que el propio usuario haya hecho.
 * 3. Si no existe, lo crea con la contraseña configurada (SUPERADMIN_PASSWORD),
 *    `isSuperAdmin: true` y sin empresa (`companyId: null`), igual que hace
 *    `prisma/seed.ts`.
 *
 * Se ejecuta al arrancar el servidor (ver `src/server.ts`).
 */
export async function ensureSuperadmin(): Promise<void> {
  const email = envConfig.SUPERADMIN_EMAIL;
  const password = envConfig.SUPERADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Ya existe: solo asegurar que sea un superadmin activo (sin tocar credenciales)
    if (!existing.isSuperAdmin || !existing.isActive) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isSuperAdmin: true, isActive: true },
      });
      console.log(
        `👑 Bootstrap: usuario existente ${email} promovido a Superadmin activo`,
      );
      return;
    }

    console.log(`👑 Bootstrap: Superadmin ya existe (${email})`);
    return;
  }

  // No existe: crearlo
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      firstName: "Super",
      lastName: "Admin",
      passwordHash,
      isActive: true,
      isSuperAdmin: true,
      companyId: null,
    },
  });

  console.log(
    `👑 Bootstrap: Superadmin creado (${email} / ${password})`,
  );
}
