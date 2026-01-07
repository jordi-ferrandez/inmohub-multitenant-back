export interface AssignmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
  buildingId?: number;
  type?: "Following" | "Mailboxing";
  isActive?: boolean; // basado en fechas startDate y endDate
  sortBy?: "startDate" | "endDate" | "createdAt" | "user.firstName" | "building.street";
  sortOrder?: "asc" | "desc";
}
