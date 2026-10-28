import { prisma } from "@core/lib";
import { Prisma } from "./../../../../generated/prisma";
import {
  CreatePersonBody,
  UpdatePersonBody,
  GetPersonsQuery,
  SearchPersonsQuery,
  PersonPhoneInput,
  PersonPhoneUpdateInput,
  AssignPropertyBody,
  UnassignPropertyBody,
} from "../types/personTypes";

export class PersonService {
  private buildTenantFilter(companyId: number | null): { companyId?: number } {
    return companyId ? { companyId } : {};
  }

  async createPerson(data: CreatePersonBody, companyId: number | null) {
    const { phones, ...personData } = data;

    // Verificar que el email sea único solo si se proporciona
    if (personData.email) {
      const existingPerson = await prisma.person.findFirst({
        where: { email: personData.email, ...this.buildTenantFilter(companyId) },
      });

      if (existingPerson) {
        throw new Error("Ya existe una persona con este email");
      }
    }

    const args: any = {
      data: {
        ...personData,
        phones: phones ? { create: phones } : undefined,
        companyId: companyId ?? undefined,
      },
      include: {
        phones: true,
      },
    };
    return prisma.person.create(args);
  }

  async updatePerson(id: number, data: UpdatePersonBody, companyId: number | null) {
    const { phones, ...personData } = data;

    // Verificar que la persona existe
    const existingPerson = await prisma.person.findFirst({
      where: { id, ...this.buildTenantFilter(companyId) },
    });

    if (!existingPerson) {
      throw new Error("Persona no encontrada");
    }

    // Si se actualiza el email, verificar que sea único
    if (personData.email && personData.email !== existingPerson.email) {
      // Solo verificar unicidad si el nuevo email no es null
      if (personData.email) {
        const emailExists = await prisma.person.findFirst({
          where: { email: personData.email, ...this.buildTenantFilter(companyId) },
        });

        if (emailExists) {
          throw new Error("Ya existe una persona con este email");
        }
      }
    }

    // Manejar teléfonos: eliminar los que no vienen, actualizar existentes y crear nuevos
    let phoneOps = {};
    if (phones) {
      // 1. Identificar teléfonos a eliminar (soft delete)
      const incomingIds = phones.filter((p) => p.id).map((p) => p.id as number);
      
      await prisma.personPhone.updateMany({
        where: {
          personId: id,
          id: { notIn: incomingIds },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // 2. Preparar actualizaciones y creaciones
      const phonesToUpdate = phones.filter((phone) => phone.id);
      const phonesToCreate = phones.filter((phone) => !phone.id);

      phoneOps = {
        update: phonesToUpdate.map((phone) => ({
          where: { id: phone.id },
          data: { phone: phone.phone, type: phone.type },
        })),
        create: phonesToCreate.map((phone) => ({
          phone: phone.phone,
          type: phone.type,
        })),
      };
    }

    return prisma.person.update({
      where: { id, ...this.buildTenantFilter(companyId) },
      data: {
        ...personData,
        ...(phones ? { phones: phoneOps } : {}),
      },
      include: {
        phones: true,
      },
    });
  }

  async getPersons(query: GetPersonsQuery, companyId: number | null) {
    const { page, limit, search } = query;
    const tenantFilter = this.buildTenantFilter(companyId);
    const where = search
      ? {
          ...tenantFilter,
          deletedAt: null,
          OR: [
            {
              firstName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              lastName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                not: null,
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              phones: {
                some: {
                  phone: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          ],
        }
      : { ...tenantFilter, deletedAt: null };

    const [items, total] = await Promise.all([
      prisma.person.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          phones: true,
          propertiesOwned: {
            where: { deletedAt: null },
          },
          propertiesTenanted: {
            where: { deletedAt: null },
          },
          presidentBuildings: {
            where: { deletedAt: null },
          },
          informerBuildings: {
            where: { deletedAt: null },
          },
          contactBuildings: {
            where: { deletedAt: null },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.person.count({ where }),
    ]);

    // Agregar contadores de relaciones a cada item
    const dataWithCounts = items.map((item) => ({
      ...item,
      _count: {
        propertiesOwned: item.propertiesOwned.length,
        propertiesTenanted: item.propertiesTenanted.length,
        presidentBuildings: item.presidentBuildings.length,
        informerBuildings: item.informerBuildings.length,
        contactBuildings: item.contactBuildings.length,
      },
    }));

    return {
      data: dataWithCounts,
      metadata: {
        totalItems: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchPersons(query: SearchPersonsQuery, companyId: number | null) {
    const { q } = query;
    const tenantFilter = this.buildTenantFilter(companyId);

    const persons = await prisma.person.findMany({
      where: {
        ...tenantFilter,
        deletedAt: null,
        OR: [
          {
            firstName: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            lastName: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            email: {
              not: null,
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 20,
      orderBy: { firstName: "asc" },
    });

    return persons.map((person) => ({
      ...person,
      fullName: `${person.firstName} ${person.lastName}`,
    }));
  }

  async deletePerson(id: number, companyId: number | null) {
    const existingPerson = await prisma.person.findFirst({
      where: { id, ...this.buildTenantFilter(companyId) },
    });

    if (!existingPerson) {
      throw new Error("Persona no encontrada");
    }

    if (existingPerson.deletedAt) {
      throw new Error("La persona ya ha sido eliminada");
    }

    // Soft delete: marcar como eliminado y eliminar teléfonos
    await prisma.$transaction([
      prisma.personPhone.updateMany({
        where: { personId: id },
        data: { deletedAt: new Date() },
      }),
      prisma.person.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: "Persona eliminada correctamente" };
  }

  async assignPropertyToPerson(
    personId: number,
    propertyId: number,
    role: AssignPropertyBody["role"],
    companyId: number | null
  ) {
    // Verificar que la persona existe
    const person = await prisma.person.findFirst({
      where: { id: personId, ...this.buildTenantFilter(companyId) },
    });

    if (!person) {
      throw new Error("Persona no encontrada");
    }

    if (person.deletedAt) {
      throw new Error("La persona ha sido eliminada");
    }

    // Verificar que la propiedad existe
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ...this.buildTenantFilter(companyId) },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    if (property.deletedAt) {
      throw new Error("La propiedad ha sido eliminada");
    }

    // Verificar si ya existe la relación
    const existingRelation = await prisma.propertyPerson.findFirst({
      where: {
        propertyId,
        personId,
        role: role as "owner" | "tenant",
        deletedAt: null,
      },
    });

    if (existingRelation) {
      const roleMessage = role === "owner" ? "propietario" : "inquilino";
      throw new Error(`La persona ya está asignada como ${roleMessage} de esta propiedad`);
    }

    // Crear la relación en PropertyPerson (many-to-many)
    await prisma.propertyPerson.create({
      data: {
        propertyId,
        personId,
        role: role as "owner" | "tenant",
      },
    });

    // Mantener compatibilidad: actualizar también ownerId/tenantId si no existe
    // Esto permite migración gradual
    const updateData: { ownerId?: number; tenantId?: number } = {};
    if (role === "owner" && !property.ownerId) {
      updateData.ownerId = personId;
    } else if (role === "tenant" && !property.tenantId) {
      updateData.tenantId = personId;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.property.update({
        where: { id: propertyId, ...this.buildTenantFilter(companyId) },
        data: updateData,
      });
    }

    const roleMessage = role === "owner" ? "propietario" : "inquilino";
    return { message: `Persona asignada correctamente como ${roleMessage}` };
  }

  async unassignPropertyFromPerson(
    personId: number,
    propertyId: number,
    role: UnassignPropertyBody["role"],
    companyId: number | null
  ) {
    // Verificar que la persona existe
    const person = await prisma.person.findFirst({
      where: { id: personId, ...this.buildTenantFilter(companyId) },
    });

    if (!person) {
      throw new Error("Persona no encontrada");
    }

    // Verificar que la propiedad existe
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ...this.buildTenantFilter(companyId) },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    // Verificar que la persona está asignada a la propiedad con el rol especificado
    const existingRelation = await prisma.propertyPerson.findFirst({
      where: {
        propertyId,
        personId,
        role: role as "owner" | "tenant",
        deletedAt: null,
      },
    });

    if (!existingRelation) {
      // Fallback: verificar en campos legacy
      const isAssignedLegacy =
        role === "owner"
          ? property.ownerId === personId
          : property.tenantId === personId;

      if (!isAssignedLegacy) {
        throw new Error(
          `La persona no está asignada como ${
            role === "owner" ? "propietario" : "inquilino"
          } de esta propiedad`
        );
      }

      // Si está en legacy, solo limpiar legacy
      const updateData =
        role === "owner" ? { ownerId: null } : { tenantId: null };
      await prisma.property.update({
        where: { id: propertyId, ...this.buildTenantFilter(companyId) },
        data: updateData,
      });
    } else {
      // Soft delete de la relación en PropertyPerson
      await prisma.propertyPerson.update({
        where: { id: existingRelation.id },
        data: { deletedAt: new Date() },
      });
    }

    return { message: "Persona desasignada correctamente" };
  }

  async getPersonRelations(id: number, companyId: number | null) {
    // Verificar que la persona existe
    const person = await prisma.person.findFirst({
      where: { id, ...this.buildTenantFilter(companyId) },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!person) {
      throw new Error("Persona no encontrada");
    }

    // Obtener edificios donde es presidente
    const presidentBuildings = await prisma.building.findMany({
      where: {
        presidentId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        street: true,
        number: true,
        block: true,
        stair: true,
      },
      orderBy: [{ street: "asc" }, { number: "asc" }],
    });

    // Obtener edificios donde es informador
    const informerBuildings = await prisma.building.findMany({
      where: {
        informerId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        street: true,
        number: true,
        block: true,
        stair: true,
      },
      orderBy: [{ street: "asc" }, { number: "asc" }],
    });

    // Obtener edificios donde es contacto
    const contactBuildings = await prisma.building.findMany({
      where: {
        contactId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        street: true,
        number: true,
        block: true,
        stair: true,
      },
      orderBy: [{ street: "asc" }, { number: "asc" }],
    });

    // Obtener propiedades donde es propietario
    const ownerProperties = await prisma.property.findMany({
      where: {
        ownerId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
        floor: true,
        building: {
          select: {
            id: true,
            street: true,
            number: true,
            block: true,
            stair: true,
          },
        },
      },
      orderBy: [
        { building: { street: "asc" } },
        { building: { number: "asc" } },
        { floor: "asc" },
      ],
    });

    // Obtener propiedades donde es inquilino
    const tenantProperties = await prisma.property.findMany({
      where: {
        tenantId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
        floor: true,
        building: {
          select: {
            id: true,
            street: true,
            number: true,
            block: true,
            stair: true,
          },
        },
      },
      orderBy: [
        { building: { street: "asc" } },
        { building: { number: "asc" } },
        { floor: "asc" },
      ],
    });

    return {
      presidentBuildings,
      informerBuildings,
      contactBuildings,
      ownerProperties,
      tenantProperties,
    };
  }
}
