export type AssignmentType = "Following" | "Mailboxing";

export interface AssignmentDTO {
  id: number;
  userId: number;
  buildingId: number;
  type: AssignmentType;
  startDate: Date;
  endDate: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  building: {
    id: number;
    street: string;
    number: number;
    block?: string;
    stair?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
