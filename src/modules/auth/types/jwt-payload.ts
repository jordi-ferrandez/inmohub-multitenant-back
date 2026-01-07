export interface JwtPayload {
  userId: string;
  email: string;
  roles: Array<{
    displayName: string;
    name: string;
  }>;
  iat?: number;
  exp?: number;
}
