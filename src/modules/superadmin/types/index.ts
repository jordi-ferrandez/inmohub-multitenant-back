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

export type SuperadminRoleDTO = {
  id: number;
  name: string;
  displayName: string;
};

export type SuperadminUserDTO = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  companyId: number | null;
  companyName?: string | null;
  roles: SuperadminRoleDTO[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSuperadminUserDTO = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  isActive?: boolean;
  /** Si es true, se crea sin empresa y sin roles (flag global) */
  isSuperAdmin?: boolean;
  companyId?: number | null;
  roleIds?: number[];
};

export type UpdateSuperadminUserDTO = {
  email?: string;
  firstName?: string;
  lastName?: string;
  /** En edición es opcional: si viene, se cambia la contraseña */
  password?: string;
  phone?: string | null;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  companyId?: number | null;
  roleIds?: number[];
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
