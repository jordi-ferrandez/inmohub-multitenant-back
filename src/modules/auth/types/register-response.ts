export type RegisterResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: Date;
};