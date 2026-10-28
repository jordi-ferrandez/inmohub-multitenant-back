export type CreateUserRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  companyId?: number;
};
