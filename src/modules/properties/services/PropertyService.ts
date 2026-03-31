import { prisma } from "@core/lib";
import { Prisma, Property } from "../../../generated/prisma";
import {
  GetPropertiesQuery,
} from "../types/propertyTypes";

export class PropertyService {
  propertyRelations = {
    attachments: true,
    building: true,
    capturedBy: true,
    followUps: true,
    owner: true, // Legacy, mantener para compatibilidad
    tenant: true, // Legacy, mantener para compatibilidad
    listings: true,
    propertyPersons: {
      where: {
        deletedAt: null,
      },
      include: {
        person: {
          include: {
            phones: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    },
  };
  async getPropertyById(id: number): Promise<Property> {
    const property = await prisma.property.findUnique({
      where: { id },
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

  async createProperty(data: any): Promise<Property> {
    try {
      const property = await prisma.property.create({
        data: {
          buildingId: Number(data.buildingId),
          floor: data.floor ? Number(data.floor) : 0,
          number: String(data.number),
          inmovillaCode: data.inmovillaCode ? Number(data.inmovillaCode) : undefined,
          status: data.status || "sin_estado",
        },
        include: this.propertyRelations,
      });
      return property;
    } catch (error) {
      throw new Error(`Error creating property: ${error}`);
    }
  }

  async deleteProperty(id: number): Promise<void> {
    try {
      await prisma.property.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Error deleting property: ${error}`);
    }
  }


  async patchPropertyById(
    id: number,
    data: Partial<Property>
  ): Promise<Property> {
    const property = await prisma.property.update({
      where: { id },
      data,
      include: this.propertyRelations,
    });
    if (!property) throw new Error("No existe una property con ese id");
    return property;
  }

	async getProperty(filters: GetPropertiesQuery) {
		const { page, limit, ...filterData } = filters;
		const skip = (page - 1) * limit;	
		
		// const where: Prisma.BuildingWhereInput = {
    //   inmovillaCode = filterData.inmovillaCode;
    // };
    
    const myInmovillaCode  = filterData.inmovillaCode   ? filterData.inmovillaCode  : undefined;
    const myNumber= filterData.number  ? filterData.number : undefined;
    const myFloor = filterData.floor  ? filterData.floor : undefined;
    
    const myStartAppraisalPrice   = filterData.startAppraisalPrice ? filterData.startAppraisalPrice : undefined;
    const myEndAppraisalPrice     = filterData.endAppraisalPrice ? filterData.endAppraisalPrice : undefined;

    const myStartSalePrice  = filterData.startSalePrice ? filterData.startSalePrice : undefined;
    const myEndSalePrice    = filterData.endSalePrice ? filterData.endSalePrice : undefined;

    const myStartRentalPrice  = filterData.startRentalPrice ? filterData.startRentalPrice : undefined;
    const myEndRentalPrice    = filterData.endRentalPrice ? filterData.endRentalPrice : undefined;

    // filterData.status
    // filterData.buildingStreet

		const [property, totalItems] = await prisma.$transaction([		
			prisma.property.findMany({
				skip: skip,
				take: limit,		
				include: this.propertyRelations, 
        where: {
          inmovillaCode: myInmovillaCode,
          number: myNumber,
          floor: myFloor,
          appraisalPrice: {
            gte: myStartAppraisalPrice,
            lte: myEndAppraisalPrice, 
          },
          salePrice: {
            gte: myStartSalePrice,
            lte: myEndSalePrice,
          },
          rentalPrice: {
            gte: myStartRentalPrice,
            lte: myEndRentalPrice,
          }
        }   
			}),
			prisma.property.count(),
		]);			
		
		if (!property) throw new Error("No existe properties");
		
		const totalPages = Math.ceil(totalItems / limit);
		
		return { data: property, meta: { totalItems, page, limit, totalPages } };
		
	}	

}
