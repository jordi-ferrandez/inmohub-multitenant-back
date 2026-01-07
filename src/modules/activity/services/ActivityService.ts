import { prisma } from "@core/lib";
import {
  ActivityQueryParams,
  ActivityReportDTO,
  DailyContactActivity,
  DailyMailboxingActivity,
  ActivityItemsQueryParams,
  ActivityItemsResponse,
  ActivityItem,
  FollowUpActivityItem,
  MailboxingActivityItem,
} from "../types";
import {
  ContactType,
  LetterType,
  ObservationType,
} from "@modules/followups/types/followup-types";

class ActivityService {
  async getActivityReport(
    query: ActivityQueryParams
  ): Promise<ActivityReportDTO> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    
    // Asegurar que endDate incluya todo el día
    endDate.setHours(23, 59, 59, 999);

    // Construir filtro base para seguimientos
    const followUpWhere: any = {
      OR: [
        { executedDate: { gte: startDate, lte: endDate } },
        { createdAt: { gte: startDate, lte: endDate } },
      ],
    };

    if (query.userId) {
      followUpWhere.sellerId = query.userId;
    }

    // Construir filtro base para buzoneamientos
    const mailboxingWhere: any = {
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    };

    if (query.userId) {
      mailboxingWhere.mailboxerId = query.userId;
    }

    // Obtener seguimientos con información de Property
    const followUps = await prisma.followUp.findMany({
      where: followUpWhere,
      select: {
        executedDate: true,
        createdAt: true,
        wasContacted: true,
        contactType: true,
        letterType: true,
        observationType: true,
        property: {
          select: {
            id: true,
            tenantId: true,
            ownerId: true,
            occupiedBy: true,
            isSecondResidence: true,
            isPresident: true,
            isInformer: true,
            noBell: true,
            noCounter: true,
            noDoormat: true,
            noDisturb: true,
          },
        },
      },
    });

    // Obtener buzoneamientos
    const mailboxings = await prisma.mailboxing.findMany({
      where: mailboxingWhere,
      select: {
        date: true,
        status: true,
      },
    });

    // Generar todas las fechas del rango
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Agrupar seguimientos por fecha
    const contactActivities: DailyContactActivity[] = dates.map((date) => {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayFollowUps = followUps.filter((fu) => {
        const fuDate = fu.executedDate || fu.createdAt;
        return fuDate >= dateStart && fuDate <= dateEnd;
      });

      // Inicializar contadores
      let contacted = 0;
      let directContact = 0;
      let phoneContact = 0;
      let letterTenant = 0;
      let letterOwner = 0;
      let letterCaregiver = 0;
      
      let notContacted = 0;
      let dog = 0;
      let noises = 0;
      let peephole = 0;
      let letterSoldByUs = 0;
      let letterEmptyProperty = 0;
      let letterInheritance = 0;
      let letterPropertyForSale = 0;
      let letterPropertyLandlord = 0;
      let letterAdvisorPresentation = 0;
      
      let occupiedBy = 0;
      let occupiedByTenant = 0;
      let occupiedByOwner = 0;
      let occupiedByEmpty = 0;
      let occupiedBySecondResidence = 0;
      let occupiedByNotIdentified = 0;
      
      let doorInfo = 0;
      let doorInfoPresident = 0;
      let doorInfoInformer = 0;
      let doorInfoNoBell = 0;
      let doorInfoNoCounter = 0;
      let doorInfoNoDoormat = 0;
      let doorInfoNoDisturb = 0;

      // Set para evitar contar la misma Property múltiples veces
      const processedPropertiesForOccupied = new Set<number>();
      const processedPropertiesForDoorInfo = new Set<number>();

      dayFollowUps.forEach((fu) => {
        if (fu.wasContacted) {
          contacted++;
          if (fu.contactType === ContactType.DIRECT) {
            directContact++;
          } else if (fu.contactType === ContactType.PHONE) {
            phoneContact++;
          } else if (fu.contactType === ContactType.LETTER_IN_HAND) {
            if (fu.letterType === LetterType.TENANT) {
              letterTenant++;
            } else if (fu.letterType === LetterType.OWNER) {
              letterOwner++;
            } else if (fu.letterType === LetterType.CARETAKER) {
              letterCaregiver++;
            }
          }
        } else {
          notContacted++;
          // Contar tipos de observación
          if (fu.observationType === ObservationType.DOG) {
            dog++;
          } else if (fu.observationType === ObservationType.NOISES) {
            noises++;
          } else if (fu.observationType === ObservationType.PEEPHOLE) {
            peephole++;
          } else if (fu.observationType === ObservationType.LETTER_UNDER_DOOR && fu.letterType) {
            // Los tipos específicos de cartas están en letterType cuando observationType es LETTER_UNDER_DOOR
            if (fu.letterType === LetterType.LETTER_SOLD_BY_US) {
              letterSoldByUs++;
            } else if (fu.letterType === LetterType.LETTER_EMPTY_PROPERTY) {
              letterEmptyProperty++;
            } else if (fu.letterType === LetterType.LETTER_INHERITANCE) {
              letterInheritance++;
            } else if (fu.letterType === LetterType.LETTER_PROPERTY_FOR_SALE) {
              letterPropertyForSale++;
            } else if (fu.letterType === LetterType.LETTER_PROPERTY_LANDLORD) {
              letterPropertyLandlord++;
            } else if (fu.letterType === LetterType.LETTER_ADVISOR_PRESENTATION) {
              letterAdvisorPresentation++;
            }
          }
        }

        // Agrupar "Ocupado por" basándose en Property (solo una vez por Property)
        if (fu.property && !processedPropertiesForOccupied.has(fu.property.id)) {
          processedPropertiesForOccupied.add(fu.property.id);
          const prop = fu.property;
          
          if (prop.tenantId) {
            occupiedBy++;
            occupiedByTenant++;
          } else if (prop.ownerId) {
            occupiedBy++;
            occupiedByOwner++;
          } else if (prop.occupiedBy === "Vacio" || prop.occupiedBy === "Vacío" || prop.occupiedBy === "Vacio") {
            occupiedBy++;
            occupiedByEmpty++;
          } else if (prop.isSecondResidence) {
            occupiedBy++;
            occupiedBySecondResidence++;
          } else if (!prop.tenantId && !prop.ownerId && !prop.occupiedBy && !prop.isSecondResidence) {
            occupiedBy++;
            occupiedByNotIdentified++;
          }
        }

        // Agrupar "Información puerta" basándose en Property (solo una vez por Property)
        if (fu.property && !processedPropertiesForDoorInfo.has(fu.property.id)) {
          processedPropertiesForDoorInfo.add(fu.property.id);
          const prop = fu.property;
          
          if (prop.isPresident) {
            doorInfo++;
            doorInfoPresident++;
          }
          if (prop.isInformer) {
            doorInfo++;
            doorInfoInformer++;
          }
          if (prop.noBell) {
            doorInfo++;
            doorInfoNoBell++;
          }
          if (prop.noCounter) {
            doorInfo++;
            doorInfoNoCounter++;
          }
          if (prop.noDoormat) {
            doorInfo++;
            doorInfoNoDoormat++;
          }
          if (prop.noDisturb) {
            doorInfo++;
            doorInfoNoDisturb++;
          }
        }
      });

      return {
        date,
        contacted,
        directContact,
        phoneContact,
        letterTenant,
        letterOwner,
        letterCaregiver,
        notContacted,
        dog,
        noises,
        peephole,
        letterSoldByUs,
        letterEmptyProperty,
        letterInheritance,
        letterPropertyForSale,
        letterPropertyLandlord,
        letterAdvisorPresentation,
        occupiedBy,
        occupiedByTenant,
        occupiedByOwner,
        occupiedByEmpty,
        occupiedBySecondResidence,
        occupiedByNotIdentified,
        doorInfo,
        doorInfoPresident,
        doorInfoInformer,
        doorInfoNoBell,
        doorInfoNoCounter,
        doorInfoNoDoormat,
        doorInfoNoDisturb,
      };
    });

    // Agrupar buzoneamientos por fecha
    const mailboxingActivities: DailyMailboxingActivity[] = dates.map((date) => {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayMailboxings = mailboxings.filter((mb) => {
        const mbDate = new Date(mb.date);
        return mbDate >= dateStart && mbDate <= dateEnd;
      });

      let inside = 0;
      let outside = 0;
      let noDisturb = 0;

      dayMailboxings.forEach((mb) => {
        if (mb.status === "inside") {
          inside++;
        } else if (mb.status === "outside") {
          outside++;
        } else if (mb.status === "no_disturb") {
          noDisturb++;
        }
      });

      return {
        date,
        inside,
        outside,
        noDisturb,
      };
    });

    return {
      contactActivities,
      mailboxingActivities,
      dateRange: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
    };
  }

  async getActivityItems(
    query: ActivityItemsQueryParams
  ): Promise<ActivityItemsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const items: ActivityItem[] = [];

    // Obtener seguimientos si no se especifica tipo o si es "followup"
    if (!query.type || query.type === "followup") {
      const followUpWhere: any = {
        OR: [
          { executedDate: { gte: startDate, lte: endDate } },
          { createdAt: { gte: startDate, lte: endDate } },
        ],
        deletedAt: null,
      };

      if (query.userId) {
        followUpWhere.sellerId = query.userId;
      }

      if (query.date) {
        const dateStart = new Date(query.date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(query.date);
        dateEnd.setHours(23, 59, 59, 999);
        followUpWhere.OR = [
          { executedDate: { gte: dateStart, lte: dateEnd } },
          { createdAt: { gte: dateStart, lte: dateEnd } },
        ];
      }

      if (query.search) {
        followUpWhere.comment = {
          contains: query.search,
          mode: "insensitive",
        };
      }

      const followUps = await prisma.followUp.findMany({
        where: followUpWhere,
        include: {
          property: {
            include: {
              building: true,
              owner: true,
              tenant: true,
            },
          },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: query.sortBy === "createdAt" 
          ? { createdAt: query.sortOrder || "desc" }
          : { executedDate: query.sortOrder || "desc" },
      });

      for (const fu of followUps) {
        const date = fu.executedDate || fu.createdAt;
        const dateStr = date.toISOString().split("T")[0];

        // Determinar categoría y subcategoría
        let category = "";
        let subcategory: string | null = null;

        if (fu.wasContacted) {
          category = "contacted";
          if (fu.contactType === ContactType.DIRECT) {
            subcategory = "directContact";
          } else if (fu.contactType === ContactType.PHONE) {
            subcategory = "phoneContact";
          } else if (fu.contactType === ContactType.LETTER_IN_HAND) {
            if (fu.letterType === LetterType.TENANT) {
              subcategory = "letterTenant";
            } else if (fu.letterType === LetterType.OWNER) {
              subcategory = "letterOwner";
            } else if (fu.letterType === LetterType.CARETAKER) {
              subcategory = "letterCaregiver";
            }
          }
        } else {
          category = "notContacted";
          if (fu.observationType === ObservationType.DOG) {
            subcategory = "dog";
          } else if (fu.observationType === ObservationType.NOISES) {
            subcategory = "noises";
          } else if (fu.observationType === ObservationType.PEEPHOLE) {
            subcategory = "peephole";
          } else if (fu.observationType === ObservationType.LETTER_UNDER_DOOR && fu.letterType) {
            // Los tipos específicos de cartas están en letterType cuando observationType es LETTER_UNDER_DOOR
            if (fu.letterType === LetterType.LETTER_SOLD_BY_US) {
              subcategory = "letterSoldByUs";
            } else if (fu.letterType === LetterType.LETTER_EMPTY_PROPERTY) {
              subcategory = "letterEmptyProperty";
            } else if (fu.letterType === LetterType.LETTER_INHERITANCE) {
              subcategory = "letterInheritance";
            } else if (fu.letterType === LetterType.LETTER_PROPERTY_FOR_SALE) {
              subcategory = "letterPropertyForSale";
            } else if (fu.letterType === LetterType.LETTER_PROPERTY_LANDLORD) {
              subcategory = "letterPropertyLandlord";
            } else if (fu.letterType === LetterType.LETTER_ADVISOR_PRESENTATION) {
              subcategory = "letterAdvisorPresentation";
            }
          }
        }

        const prop = fu.property;
        
        // Determinar si debe incluirse según filtros
        let shouldInclude = true;
        
        if (query.category) {
          if (query.category === "occupiedBy") {
            // Solo incluir si la propiedad tiene información de ocupación
            shouldInclude = !!(prop.tenantId || prop.ownerId || prop.occupiedBy || prop.isSecondResidence);
            if (shouldInclude) {
              category = "occupiedBy";
              subcategory = prop.tenantId ? "occupiedByTenant" 
                : prop.ownerId ? "occupiedByOwner"
                : prop.occupiedBy === "Vacio" || prop.occupiedBy === "Vacío" ? "occupiedByEmpty"
                : prop.isSecondResidence ? "occupiedBySecondResidence"
                : "occupiedByNotIdentified";
            }
          } else if (query.category === "doorInfo") {
            // Solo incluir si la propiedad tiene información de puerta
            shouldInclude = !!(prop.isPresident || prop.isInformer || prop.noBell || prop.noCounter || prop.noDoormat || prop.noDisturb);
            if (shouldInclude) {
              category = "doorInfo";
              subcategory = prop.isPresident ? "doorInfoPresident"
                : prop.isInformer ? "doorInfoInformer"
                : prop.noBell ? "doorInfoNoBell"
                : prop.noCounter ? "doorInfoNoCounter"
                : prop.noDoormat ? "doorInfoNoDoormat"
                : "doorInfoNoDisturb";
            }
          } else if (query.category !== category) {
            shouldInclude = false;
          }
        }
        
        if (query.subcategory && query.subcategory !== subcategory) {
          shouldInclude = false;
        }
        
        if (!shouldInclude) {
          continue;
        }

        // Agregar el item
        items.push({
          type: "followup",
          id: fu.id,
          date: dateStr,
          wasContacted: fu.wasContacted,
          contactType: fu.contactType,
          letterType: fu.letterType,
          observationType: fu.observationType,
          comment: fu.comment,
          property: {
            id: prop.id,
            inmovillaCode: prop.inmovillaCode,
            number: prop.number,
            floor: prop.floor,
            buildingId: prop.buildingId,
          },
          building: {
            id: prop.building.id,
            street: prop.building.street,
            number: String(prop.building.number),
            block: prop.building.block,
            stair: prop.building.stair,
          },
          user: {
            id: fu.seller.id,
            firstName: fu.seller.firstName,
            lastName: fu.seller.lastName,
            email: fu.seller.email,
          },
          owner: prop.owner ? {
            id: prop.owner.id,
            firstName: prop.owner.firstName,
            lastName: prop.owner.lastName,
            email: prop.owner.email,
          } : null,
          tenant: prop.tenant ? {
            id: prop.tenant.id,
            firstName: prop.tenant.firstName,
            lastName: prop.tenant.lastName,
            email: prop.tenant.email,
          } : null,
          category,
          subcategory,
        });
      }
    }

    // Obtener buzoneamientos si no se especifica tipo o si es "mailboxing"
    if (!query.type || query.type === "mailboxing") {
      const mailboxingWhere: any = {
        date: { gte: startDate, lte: endDate },
        deletedAt: null,
      };

      if (query.userId) {
        mailboxingWhere.mailboxerId = query.userId;
      }

      if (query.date) {
        const dateStart = new Date(query.date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(query.date);
        dateEnd.setHours(23, 59, 59, 999);
        mailboxingWhere.date = { gte: dateStart, lte: dateEnd };
      }

      if (query.search) {
        mailboxingWhere.comment = {
          contains: query.search,
          mode: "insensitive",
        };
      }

      if (query.subcategory) {
        if (query.subcategory === "inside") {
          mailboxingWhere.status = "inside";
        } else if (query.subcategory === "outside") {
          mailboxingWhere.status = "outside";
        } else if (query.subcategory === "noDisturb") {
          mailboxingWhere.status = "no_disturb";
        }
      }

      const mailboxings = await prisma.mailboxing.findMany({
        where: mailboxingWhere,
        include: {
          building: true,
          mailboxer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: query.sortBy === "createdAt"
          ? { createdAt: query.sortOrder || "desc" }
          : { date: query.sortOrder || "desc" },
      });

      for (const mb of mailboxings) {
        const dateStr = mb.date.toISOString().split("T")[0];
        const subcategory = mb.status === "inside" ? "inside"
          : mb.status === "outside" ? "outside"
          : "noDisturb";

        items.push({
          type: "mailboxing",
          id: mb.id,
          date: dateStr,
          status: mb.status,
          comment: mb.comment,
          building: {
            id: mb.building.id,
            street: mb.building.street,
            number: String(mb.building.number),
            block: mb.building.block,
            stair: mb.building.stair,
          },
          user: {
            id: mb.mailboxer.id,
            firstName: mb.mailboxer.firstName,
            lastName: mb.mailboxer.lastName,
            email: mb.mailboxer.email,
          },
          category: "mailboxing",
          subcategory,
        });
      }
    }

    // Ordenar items por fecha
    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (query.sortOrder === "asc") {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

    // Aplicar paginación manual (ya que combinamos dos tipos de items)
    const paginatedItems = items.slice(skip, skip + limit);
    const total = items.length;
    const totalPages = Math.ceil(total / limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

export default new ActivityService();

