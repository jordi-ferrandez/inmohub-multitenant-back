export type CompanyDTO = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  propertyCount?: number;
  buildingCount?: number;
};

export type CreateCompanyDTO = {
  name: string;
  directorEmail: string;
  directorPassword: string;
  directorFirstName: string;
  directorLastName: string;
};

export type UpdateCompanyDTO = {
  name?: string;
  isActive?: boolean;
};

export type SuperadminUserQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: number;
  role?: string;
  isActive?: boolean;
  sortBy?: "firstName" | "lastName" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export type SuperadminStatsDTO = {
  totalCompanies: number;
  totalUsers: number;
  totalProperties: number;
  totalBuildings: number;
  companies: Array<{
    id: number;
    name: string;
    userCount: number;
    propertyCount: number;
    buildingCount: number;
  }>;
};
