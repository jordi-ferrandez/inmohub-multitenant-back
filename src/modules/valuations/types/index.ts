export interface CreateValuationRequest {
  slug: string;
  property: {
    address: string;
    municipality: string;
    province: string;
    zipCode: string;
    type: string;
    builtM2: number;
    rooms: number;
    bathrooms: number;
    yearBuilt?: number;
    state?: string;
    floor?: string;
    hasElevator: boolean;
    hasGarage: boolean;
    hasTerrace: boolean;
    hasPool: boolean;
    hasGarden: boolean;
    hasStorage: boolean;
  };
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    consent?: boolean;
  };
}

export interface CreateInternalValuationRequest {
  propertyId?: number;
  property: {
    address: string;
    municipality: string;
    province: string;
    zipCode: string;
    type: string;
    builtM2: number;
    rooms: number;
    bathrooms: number;
    yearBuilt?: number;
    state?: string;
    floor?: string;
    hasElevator: boolean;
    hasGarage: boolean;
    hasTerrace: boolean;
    hasPool: boolean;
    hasGarden: boolean;
    hasStorage: boolean;
  };
}

export interface ValuationResult {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  m2Price: number;
}
