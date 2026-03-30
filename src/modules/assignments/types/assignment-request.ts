export interface CreateAssignmentRequest {
  userId: number;
  buildingId: number;
  type: "Following" | "Mailboxing";
  startDate: Date;
  endDate?: Date; // Opcional: si no viene, se establece igual a startDate
}

export interface UpdateAssignmentRequest {
  userId?: number;
  buildingId?: number;
  type?: "Following" | "Mailboxing";
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}
