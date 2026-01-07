export interface AgentAssignmentDTO {
  id: number;
  userId: number;
  buildingId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  building: {
    id: number;
    street: string;
    number: number;
    block?: string;
    stair?: string;
    properties: {
      id: number;
      number: string;
      floor: number;
      followUpsCount: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailablePropertyDTO {
  id: number;
  number: string;
  floor: number;
  building: {
    id: number;
    street: string;
    number: number;
    block?: string;
    stair?: string;
  };
  followUpsCount: number;
}

export interface AvailablePropertyQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AvailablePropertyListResponse {
  data: AvailablePropertyDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PropertyWithFollowUpsDTO {
  id: number;
  number: string;
  floor: number;
  building: {
    id: number;
    street: string;
    number: number;
    block?: string;
    stair?: string;
  };
  followUps: {
    id: number;
    wasContacted: boolean;
    contactType?: string;
    letterType?: string;
    observationType?: string;
    plannedDate?: string;
    executedDate?: string;
    comment?: string;
    seller: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  }[];
}
