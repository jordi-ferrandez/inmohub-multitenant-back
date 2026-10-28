export type UserQueryParams = {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  companyId?: number;
  sortBy: "firstName" | "lastName" | "email" | "createdAt";
  sortOrder: "asc" | "desc";
};
