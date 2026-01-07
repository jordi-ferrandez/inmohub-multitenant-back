export interface AssignmentSummaryDTO {
  agent: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  habitualAssignments: {
    buildings: number;
    totalProperties: number;
    assignments: Array<{
      id: number;
      buildingId: number;
      buildingName: string;
      type: "Following" | "Mailboxing";
      startDate: Date;
      endDate: Date;
      propertiesCount: number;
    }>;
  };
  activeAssignments: {
    buildings: number;
    totalProperties: number;
    assignments: Array<{
      id: number;
      buildingId: number;
      buildingName: string;
      type: "Following" | "Mailboxing";
      startDate: Date;
      endDate: Date;
      propertiesCount: number;
    }>;
  };
  futureAssignments: {
    buildings: number;
    totalProperties: number;
    assignments: Array<{
      id: number;
      buildingId: number;
      buildingName: string;
      type: "Following" | "Mailboxing";
      startDate: Date;
      endDate: Date;
      propertiesCount: number;
    }>;
  };
}

export interface AssignmentSummaryListResponse {
  status: string;
  data: AssignmentSummaryDTO[];
}

