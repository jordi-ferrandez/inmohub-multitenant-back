import { Flyer, FlyerTemplate } from "./../../../../generated/prisma";

export interface CreateFlyerDTO {
  propertyId: number;
  templateId: number;
  generatedById: number;
  qrContent: string;
}

export interface FlyerWithDetails extends Flyer {
  template: FlyerTemplate;
  generatedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}
