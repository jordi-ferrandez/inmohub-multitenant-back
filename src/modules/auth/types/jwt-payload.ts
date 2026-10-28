export interface JwtPayload {
  userId: string;
  email: string;
  roles: Array<{
    id: number;
    displayName: string;
    name: string;
  }>;
  companyId: number | null;
  isSuperAdmin: boolean;
  completedTours?: string[];
  iat?: number;
  exp?: number;
}
