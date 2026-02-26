/// <reference types="node" />

import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  const roles = [
    { name: "Agent", displayName: "Agente" },
    { name: "Director", displayName: "Director" },
    { name: "Responsible", displayName: "Responsable" },
    { name: "Mailboxer", displayName: "Buzoneador" },
  ];

  const permissions = [
    { action: "view", module: "properties" },
    { action: "edit", module: "properties" },
    { action: "manage", module: "assignments" },
    { action: "view", module: "mailboxing" },
    { action: "manage", module: "users" },
  ];

  const roleRecords = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: { displayName: role.displayName },
        create: role,
      })
    )
  );

  const permissionRecords = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: {
          action_module: {
            action: permission.action,
            module: permission.module,
          },
        },
        update: {},
        create: permission,
      })
    )
  );

  const permissionsByModule = Object.fromEntries(
    permissionRecords.map((permission) => [
      `${permission.action}:${permission.module}`,
      permission,
    ])
  );

  const rolePermissionsMap: Record<string, string[]> = {
    Director: [
      "view:properties",
      "edit:properties",
      "manage:assignments",
      "view:mailboxing",
      "manage:users",
    ],
    Agent: ["view:properties", "edit:properties"],
    Responsible: ["view:properties", "manage:assignments"],
    Mailboxer: ["view:properties", "view:mailboxing"],
  };

  for (const role of roleRecords) {
    const mappings = rolePermissionsMap[role.name] ?? [];
    for (const key of mappings) {
      const permission = permissionsByModule[key];
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("InmoHub123!", 10);

  const users = [
    {
      email: "director@example.com",
      firstName: "Diana",
      lastName: "Director",
      roles: ["Director"],
    },
    {
      email: "agent@example.com",
      firstName: "Alberto",
      lastName: "Agente",
      roles: ["Agent"],
    },
    {
      email: "responsible@example.com",
      firstName: "Raquel",
      lastName: "Responsable",
      roles: ["Responsible"],
    },
    {
      email: "mailboxer@example.com",
      firstName: "Mario",
      lastName: "Buzoneador",
      roles: ["Mailboxer"],
    },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
        isActive: true,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
        isActive: true,
      },
    });

    const roles = await prisma.role.findMany({
      where: { name: { in: user.roles } },
    });

    for (const role of roles) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: created.id, roleId: role.id } },
        update: {},
        create: { userId: created.id, roleId: role.id },
      });
    }
  }
}

async function seedPersons() {
  const persons = [
    {
      firstName: "Carlos",
      lastName: "Contact",
      email: "carlos.contact@example.com",
    },
    {
      firstName: "Paula",
      lastName: "President",
      email: "paula.president@example.com",
    },
    {
      firstName: "Ignacio",
      lastName: "Informer",
      email: "ignacio.informer@example.com",
    },
    {
      firstName: "Olivia",
      lastName: "Owner",
      email: "olivia.owner@example.com",
    },
    {
      firstName: "Tomas",
      lastName: "Tenant",
      email: "tomas.tenant@example.com",
    },
  ];

  await Promise.all(
    persons.map((person) =>
      prisma.person.upsert({
        where: { email: person.email },
        update: {
          firstName: person.firstName,
          lastName: person.lastName,
        },
        create: person,
      })
    )
  );
}

async function seedBuildingsAndProperties() {
  const [contact, president, informer, owner, tenant, agent] =
    await Promise.all([
      prisma.person.findUnique({
        where: { email: "carlos.contact@example.com" },
      }),
      prisma.person.findUnique({
        where: { email: "paula.president@example.com" },
      }),
      prisma.person.findUnique({
        where: { email: "ignacio.informer@example.com" },
      }),
      prisma.person.findUnique({
        where: { email: "olivia.owner@example.com" },
      }),
      prisma.person.findUnique({
        where: { email: "tomas.tenant@example.com" },
      }),
      prisma.user.findUnique({ where: { email: "agent@example.com" } }),
    ]);

  if (!contact || !president || !informer || !owner || !tenant || !agent) {
    throw new Error(
      "👥 Personas o usuarios requeridos no encontrados. Ejecuta seedPersons y seedUsers primero."
    );
  }

  const building = await prisma.building.upsert({
    where: {
      number_block_stair_street: {
        number: 101,
        block: "A",
        stair: "1",
        street: "Avenida Central",
      },
    },
    update: {
      contactId: contact.id,
      presidentId: president.id,
      informerId: informer.id,
    },
    create: {
      street: "Avenida Central",
      number: 101,
      block: "A",
      stair: "1",
      contactId: contact.id,
      presidentId: president.id,
      informerId: informer.id,
    },
  });

  const properties = [
    {
      inmovillaCode: 1001,
      number: "1A",
      floor: 1,
      ownerId: owner.id,
      tenantId: tenant.id,
      capturedById: agent.id,
      status: "sin_estado" as const,
    },
    {
      inmovillaCode: 1002,
      number: "2B",
      floor: 2,
      ownerId: owner.id,
      capturedById: agent.id,
      status: "noticia_venta" as const,
      salePrice: 245000,
    },
    {
      inmovillaCode: 1003,
      number: "3C",
      floor: 3,
      ownerId: owner.id,
      capturedById: agent.id,
      status: "noticia_alquiler" as const,
      rentalPrice: 950,
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: {
        number_floor_buildingId: {
          number: property.number,
          floor: property.floor,
          buildingId: building.id,
        },
      },
      update: {
        ownerId: property.ownerId,
        tenantId: property.tenantId ?? null,
        capturedById: property.capturedById ?? null,
        salePrice: property.salePrice ?? null,
        rentalPrice: property.rentalPrice ?? null,
        status: property.status,
      },
      create: {
        buildingId: building.id,
        ...property,
      },
    });
  }
}

async function seedAssignments() {
  const building = await prisma.building.findFirst();
  const agent = await prisma.user.findUnique({
    where: { email: "agent@example.com" },
  });
  const responsible = await prisma.user.findUnique({
    where: { email: "responsible@example.com" },
  });
  const mailboxer = await prisma.user.findUnique({
    where: { email: "mailboxer@example.com" },
  });

  if (!building || !agent || !responsible || !mailboxer) {
    console.warn(
      "⚠️ No se encontraron datos necesarios para asignaciones. Saltando."
    );
    return;
  }

  const assignments = [
    {
      userId: agent.id,
      buildingId: building.id,
      type: "Following" as const,
      startDate: new Date("2025-02-01T09:00:00Z"),
      endDate: new Date("2025-02-08T17:00:00Z"),
    },
    {
      userId: responsible.id,
      buildingId: building.id,
      type: "Following" as const,
      startDate: new Date("2025-02-09T09:00:00Z"),
      endDate: new Date("2025-02-16T17:00:00Z"),
    },
    {
      userId: mailboxer.id,
      buildingId: building.id,
      type: "Mailboxing" as const,
      startDate: new Date("2025-02-05T09:00:00Z"),
      endDate: new Date("2025-02-05T17:00:00Z"),
    },
  ];

  for (const assignment of assignments) {
    const existing = await prisma.assignment.findFirst({
      where: {
        userId: assignment.userId,
        buildingId: assignment.buildingId,
        type: assignment.type,
        startDate: assignment.startDate,
      },
    });

    if (!existing) {
      await prisma.assignment.create({
        data: {
          userId: assignment.userId,
          buildingId: assignment.buildingId,
          type: assignment.type,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        },
      });
    }
  }
}

async function seedFollowUps() {
  const property = await prisma.property.findFirst();
  const agent = await prisma.user.findUnique({
    where: { email: "agent@example.com" },
  });
  const director = await prisma.user.findUnique({
    where: { email: "director@example.com" },
  });

  if (!property || !agent || !director) {
    console.warn(
      "⚠️ No se encontraron datos necesarios para seguimientos. Saltando."
    );
    return;
  }

  const followUps = [
    {
      sellerId: agent.id,
      propertyId: property.id,
      wasContacted: true,
      contactType: "Directo",
      executedDate: new Date("2025-02-02T10:30:00Z"),
      comment: "Propietario interesado en valorar oferta de venta.",
    },
    {
      sellerId: director.id,
      propertyId: property.id,
      wasContacted: false,
      plannedDate: new Date("2025-02-10T11:00:00Z"),
      comment: "Programar llamada de seguimiento para cerrar visita.",
    },
  ];

  for (const followUp of followUps) {
    const existing = await prisma.followUp.findFirst({
      where: {
        sellerId: followUp.sellerId,
        propertyId: followUp.propertyId,
        comment: followUp.comment,
      },
    });

    if (!existing) {
      await prisma.followUp.create({ data: followUp });
    }
  }
}

async function seedMailboxing() {
  const building = await prisma.building.findFirst();
  const mailboxer = await prisma.user.findUnique({
    where: { email: "mailboxer@example.com" },
  });

  if (!building || !mailboxer) {
    console.warn("⚠️ No se encontraron datos para buzoneo. Saltando.");
    return;
  }

  const mailboxingEntries = [
    {
      mailboxerId: mailboxer.id,
      buildingId: building.id,
      comment: "Entrega de folletería de captación.",
      date: new Date("2025-02-05T12:00:00Z"),
      status: "inside" as const,
      attachments: [
        {
          fileName: "campaña-puertas-1.jpg",
          s3Key: "develop/mailboxing-attachments/campaña-puertas-1.jpg",
          url: "https://s3.mock/inmohub-media/develop/mailboxing-attachments/campaña-puertas-1.jpg",
          mimeType: "image/jpeg",
          fileSize: 245_678,
        },
      ],
    },
    {
      mailboxerId: mailboxer.id,
      buildingId: building.id,
      comment: "Entrega de flyer informativo.",
      date: new Date("2025-02-12T11:30:00Z"),
      status: "no_disturb" as const,
      attachments: [
        {
          fileName: "cartel-porteria.png",
          s3Key: "develop/mailboxing-attachments/cartel-porteria.png",
          url: "https://s3.mock/inmohub-media/develop/mailboxing-attachments/cartel-porteria.png",
          mimeType: "image/png",
          fileSize: 198_765,
        },
      ],
    },
  ];

  for (const entry of mailboxingEntries) {
    const existing = await prisma.mailboxing.findFirst({
      where: {
        mailboxerId: entry.mailboxerId,
        buildingId: entry.buildingId,
        date: entry.date,
      },
      include: { attachments: true },
    });

    const mailboxingRecord =
      existing ??
      (await prisma.mailboxing.create({
        data: {
          mailboxerId: entry.mailboxerId,
          buildingId: entry.buildingId,
          comment: entry.comment,
          date: entry.date,
          status: entry.status,
        },
        include: { attachments: true },
      }));

    for (const attachment of entry.attachments) {
      const already = mailboxingRecord.attachments.find(
        (item) => item.s3Key === attachment.s3Key
      );
      if (already) continue;

      await prisma.mailboxingAttachment.create({
        data: {
          mailboxingId: mailboxingRecord.id,
          fileName: attachment.fileName,
          s3Key: attachment.s3Key,
          url: attachment.url,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          uploadedById: entry.mailboxerId,
        },
      });
    }
  }
}

async function seedAttachments() {
  const [property, building, agent] = await Promise.all([
    prisma.property.findFirst({ where: { number: "1A" } }),
    prisma.building.findFirst(),
    prisma.user.findUnique({ where: { email: "agent@example.com" } }),
  ]);

  if (!property || !building || !agent) {
    console.warn("⚠️ No se encontraron recursos para adjuntos. Saltando.");
    return;
  }

  const propertyAttachments = [
    {
      propertyId: property.id,
      fileName: "fachada.jpg",
      s3Key: "develop/property-attachments/1A-fachada.jpg",
      url: "https://s3.mock/inmohub-media/develop/property-attachments/1A-fachada.jpg",
      mimeType: "image/jpeg",
      fileSize: 512_944,
    },
    {
      propertyId: property.id,
      fileName: "plano.pdf",
      s3Key: "develop/property-attachments/1A-plano.pdf",
      url: "https://s3.mock/inmohub-media/develop/property-attachments/1A-plano.pdf",
      mimeType: "application/pdf",
      fileSize: 1_024_000,
    },
  ];

  for (const attachment of propertyAttachments) {
    const existing = await prisma.propertyAttachment.findFirst({
      where: { s3Key: attachment.s3Key },
    });

    if (!existing) {
      await prisma.propertyAttachment.create({
        data: {
          ...attachment,
          uploadedById: agent.id,
        },
      });
    }
  }

  const buildingAttachments = [
    {
      buildingId: building.id,
      fileName: "acta-comunidad.pdf",
      s3Key: "develop/building-attachments/101-acta-comunidad.pdf",
      url: "https://s3.mock/inmohub-media/develop/building-attachments/101-acta-comunidad.pdf",
      mimeType: "application/pdf",
      fileSize: 860_122,
    },
  ];

  for (const attachment of buildingAttachments) {
    const existing = await prisma.buildingAttachment.findFirst({
      where: { s3Key: attachment.s3Key },
    });

    if (!existing) {
      await prisma.buildingAttachment.create({
        data: {
          ...attachment,
          uploadedById: agent.id,
        },
      });
    }
  }
}

async function seedFlyerTemplates() {
  const templates = [
    {
      id: 1,
      name: "Moderno",
      description: "Diseño limpio y minimalista con fotos grandes.",
      thumbnailUrl: "https://via.placeholder.com/150?text=Moderno",
      content: "modern",
    },
    {
      id: 2,
      name: "Clásico",
      description: "Diseño elegante y tradicional, ideal para propiedades de lujo.",
      thumbnailUrl: "https://via.placeholder.com/150?text=Clasico",
      content: "classic",
    },
    {
      id: 3,
      name: "Compacto",
      description: "Ideal para buzoneo rápido, con información clave a la vista.",
      thumbnailUrl: "https://via.placeholder.com/150?text=Compacto",
      content: "compact",
    },
  ];

  for (const template of templates) {
    await prisma.flyerTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
}

async function seedAlerts() {
  console.warn("ℹ️ El modelo Alert no existe en el esquema. Seed omitido.");
}

async function main() {
  console.log("🌱 Iniciando seed...");
  await seedRolesAndPermissions();
  console.log("✅ Roles y permisos listos");

  await seedUsers();
  console.log("✅ Usuarios creados");

  await seedPersons();
  console.log("✅ Personas creadas");

  await seedBuildingsAndProperties();
  console.log("✅ Edificios y propiedades creadas");

  await seedAssignments();
  console.log("✅ Asignaciones creadas");

  await seedFollowUps();
  console.log("✅ Seguimientos creados");

  await seedAttachments();
  console.log("✅ Adjuntos mock generados");

  await seedMailboxing();
  console.log("✅ Registros de buzoneo creados");

  await seedFlyerTemplates();
  console.log("✅ Plantillas de flyers creadas");

  await seedAlerts();

  console.log("🎉 Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
