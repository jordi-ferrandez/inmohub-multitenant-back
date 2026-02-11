import { prisma } from "@core/lib";
import { CreateValuationRequest, CreateInternalValuationRequest, ValuationResult } from "../types";
import { Prisma } from "@prisma/client"; // Fallback, or better try to use Decimal from runtime if available
// Actually, using the generated Prisma client typically exposes Prisma namespace with Decimal
import { Prisma as GeneratedPrisma } from "../../../generated/prisma"; 

export class ValuationService {
  
  async getWidgetConfig(slug: string) {
    const config = await prisma.valuationWidgetConfig.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!config) {
      throw new Error("Widget de valoración no encontrado");
    }

    if (!config.isActive) {
      throw new Error("Este widget de valoración está desactivado");
    }

    return config;
  }

  async processValuation(data: CreateValuationRequest): Promise<ValuationResult> {
    const { slug, property, contact } = data;
    
    // 1. Get Config
    const config = await this.getWidgetConfig(slug);

    // 2. Calculate Price (Mock Algorithm)
    // Base M2 price: 1500 - 3000 randomized
    const baseM2Price = 1800 + Math.random() * 1000;
    
    let modifier = 1.0;
    if (property.hasPool) modifier += 0.1;
    if (property.hasGarage) modifier += 0.15;
    if (property.hasTerrace) modifier += 0.08;
    if (property.hasElevator && (property.floor !== "0" && property.floor !== "Bajo")) modifier += 0.05;
    if (property.state === "nuevo" || property.state === "buen_estado") modifier += 0.1;

    const estimatedM2Price = baseM2Price * modifier;
    const estimatedPrice = Math.round(estimatedM2Price * property.builtM2);
    
    const rangeMargin = 0.08; // 8% margin
    const priceRange = {
      min: Math.round(estimatedPrice * (1 - rangeMargin)),
      max: Math.round(estimatedPrice * (1 + rangeMargin)),
    };

    // 3. Save Valuation Request Log
    // Use Prisma.Decimal or just string/number if schema allows? Schema says Decimal.
    // In many setups Prisma.Decimal is standard Decimal.js
    // 3. Save Valuation Request Log
    // Use Prisma.Decimal or just string/number if schema allows? Schema says Decimal.
    // In many setups Prisma.Decimal is standard Decimal.js
    const valuationRequest = await prisma.valuationRequest.create({
      data: {
        widgetConfigId: config.id,
        address: property.address,
        municipality: property.municipality,
        province: property.province,
        zipCode: property.zipCode,
        type: property.type,
        builtM2: property.builtM2,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt,
        state: property.state,
        floor: property.floor,
        hasElevator: property.hasElevator,
        hasGarage: property.hasGarage,
        hasTerrace: property.hasTerrace,
        hasGarden: property.hasGarden,
        hasStorage: property.hasStorage,
        contactName: contact?.name || "Anónimo",
        contactEmail: contact?.email || "no-email@anon.com",
        contactPhone: contact?.phone || "000000000",
        estimatedPrice: estimatedPrice, // Prisma handles number -> Decimal auto usually
        priceRangeMin: priceRange.min,
        priceRangeMax: priceRange.max,
      }
    });

    // 4. Create/Update Lead (Person) IF contact is provided
    if (contact && contact.email && contact.name) {
      let person = await prisma.person.findFirst({
        where: {
          OR: [
            { email: contact.email },
            ...(contact.phone ? [{ phones: { some: { phone: contact.phone } } }] : [])
          ]
        }
      });

      if (!person) {
        // Split name
        const nameParts = contact.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "-";

        person = await prisma.person.create({
          data: {
            firstName,
            lastName,
            email: contact.email,
            phones: contact.phone ? {
              create: {
                phone: contact.phone,
                type: "Mobile" 
              }
            } : undefined
          }
        });
      }

      // 5. Create Building/Property
      let building = await prisma.building.findFirst({
        where: {
          street: property.address,
        }
      });

      const numberMatch = property.address.match(/\d+/);
      const streetNumber = numberMatch ? parseInt(numberMatch[0]) : 0;
      const streetName = property.address.replace(/\d+/, "").trim();

      if (!building) {
        building = await prisma.building.create({
          data: {
            street: streetName || property.address,
            number: streetNumber,
            informerId: person.id, 
          }
        });
      }

      // Create Property
      let existingProperty = await prisma.property.findFirst({
        where: {
          buildingId: building.id,
          floor: parseInt(property.floor || "0") || 0, 
        }
      });

      if (!existingProperty) {
        const newProperty = await prisma.property.create({
          data: {
            inmovillaCode: Math.floor(Date.now() / 1000), // Generate unique faux code
            number: property.floor || "0", 
            floor: parseInt(property.floor || "0") || 0,
            buildingId: building.id,
            ownerId: person.id,
            status: "noticia_venta",
            description: `Captación desde Valorador Web.\nCaracterísticas: ${JSON.stringify(property)}`,
            capturedById: config.userId, 
            importantNotice: "Valoración solicitada: " + estimatedPrice + "€",
            appraisalPrice: estimatedPrice,
          }
        });
      } else {
        await prisma.followUp.create({
          data: {
            propertyId: existingProperty.id,
            sellerId: config.userId,
            wasContacted: false,
            comment: `Nueva solicitud de valoración Web. Precio estimado: ${estimatedPrice}`,
            contactType: "Web",
          }
        });
      }
    }

    return {
      estimatedPrice,
      priceRange,
      m2Price: Math.round(estimatedM2Price)
    };
  }

  async createInternalValuation(data: CreateInternalValuationRequest, userId: number): Promise<ValuationResult> {
    const { property, propertyId } = data;
    
    // 2. Calculate Price (Same algorithm)
    const baseM2Price = 1800 + Math.random() * 1000;
    
    let modifier = 1.0;
    if (property.hasPool) modifier += 0.1;
    if (property.hasGarage) modifier += 0.15;
    if (property.hasTerrace) modifier += 0.08;
    if (property.hasElevator && (property.floor !== "0" && property.floor !== "Bajo")) modifier += 0.05;
    if (property.state === "nuevo" || property.state === "buen_estado") modifier += 0.1;

    const estimatedM2Price = baseM2Price * modifier;
    const estimatedPrice = Math.round(estimatedM2Price * property.builtM2);
    
    const rangeMargin = 0.08;
    const priceRange = {
      min: Math.round(estimatedPrice * (1 - rangeMargin)),
      max: Math.round(estimatedPrice * (1 + rangeMargin)),
    };

    // 3. Save Valuation
    await prisma.valuationRequest.create({
      data: {
        generatedById: userId,
        propertyId: propertyId,
        address: property.address,
        municipality: property.municipality,
        province: property.province,
        zipCode: property.zipCode,
        type: property.type,
        builtM2: property.builtM2,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt,
        state: property.state,
        floor: property.floor,
        hasElevator: property.hasElevator,
        hasGarage: property.hasGarage,
        hasTerrace: property.hasTerrace,
        hasPool: property.hasPool,
        hasGarden: property.hasGarden,
        hasStorage: property.hasStorage,
        contactName: "Agente Interno", // Placeholder
        contactEmail: "internal@agent.com",
        contactPhone: "000000000",
        estimatedPrice: estimatedPrice,
        priceRangeMin: priceRange.min,
        priceRangeMax: priceRange.max,
      }
    });

    return {
      estimatedPrice,
      priceRange,
      m2Price: Math.round(estimatedM2Price)
    };
  }
}

export const valuationService = new ValuationService();
