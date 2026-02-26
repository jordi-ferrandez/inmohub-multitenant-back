import { AuthService } from './AuthService';
import { prisma } from '@core/lib';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));


jest.mock('@core/services', () => ({
  MailerService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordChangedNotification: jest.fn(),
    sendEmailChangedNotification: jest.fn(),
  })),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

jest.mock('@core/utils', () => ({
    getEnvironmentVariables: () => ({
        JWT_SECRET: 'test_secret',
        SALT_ROUNDS: 10
    })
}));

describe('AuthService', () => {
    let authService: AuthService;
    const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReset(prismaMock);
        authService = new AuthService();
    });

    describe('loginUser', () => {
        it('should return a token when credentials are valid', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                passwordHash: 'hashed_password',
                completedTours: [],
            };

            const mockRoles = [
                {
                    role: {
                        id: 1,
                        displayName: 'Admin',
                        name: 'admin',
                        deletedAt: null,
                    },
                },
            ];

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.userRole.findMany.mockResolvedValue(mockRoles as any);
            (compare as jest.Mock).mockResolvedValue(true);
            (sign as jest.Mock).mockReturnValue('mock_token');

            const result = await authService.loginUser({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toEqual({ token: 'mock_token' });
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });

        it('should throw error when user is not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(
                authService.loginUser({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Credenciales inválidas');
        });
    });

    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            const registerInput = {
                email: 'new@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'Agent'
            };

            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.role.findUnique.mockResolvedValue({ id: 1, name: 'Agent' } as any);
            (hash as jest.Mock).mockResolvedValue('hashed_pw');
            
            const mockCreatedUser = {
                id: 1,
                email: 'new@example.com',
                firstName: 'John',
                lastName: 'Doe',
                createdAt: new Date()
            };

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return callback(prismaMock);
            });

            prismaMock.user.create.mockResolvedValue(mockCreatedUser as any);
            prismaMock.userRole.create.mockResolvedValue({} as any);

            const result = await authService.registerUser(registerInput);

            expect(result.email).toBe('new@example.com');
            expect(prismaMock.user.create).toHaveBeenCalled();
            expect(hash).toHaveBeenCalledWith('password123', 10);
        });

        it('should throw error if email already exists', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as any);

            await expect(
                authService.registerUser({
                    email: 'existing@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'Agent'
                })
            ).rejects.toThrow('El email ya está registrado');
        });
    });
});

