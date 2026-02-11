import request from 'supertest';
import { app } from '../../app';
import { prisma } from '@core/lib';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

// Mock the prisma instance used by the app
jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

// Mock middlewares individually to ensure they are intercepted
jest.mock('@core/middlewares/authenticationToken', () => ({
    authenticationToken: (req: any, res: any, next: any) => {
        req.user = { id: 1, email: 'admin@example.com', roles: [{ name: 'admin', displayName: 'Admin' }] };
        next();
    },
}));

jest.mock('@core/middlewares/roleMiddleware', () => ({
    requireDirectorRole: (req: any, res: any, next: any) => next(),
    requireAgentRole: (req: any, res: any, next: any) => next(),
}));

jest.mock('@core/middlewares/requestLogger', () => ({
    requestLogger: (req: any, res: any, next: any) => next(),
}));

describe('Auth Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 for invalid credentials', async () => {
      // For this test, we want to bypass the mock or assume it doesn't affect the login route
      // Actually, login is NOT protected by authenticationToken, so this mock won't interfere.
      
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errorMessage).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/roles', () => {
    it('should return 200 and roles list', async () => {
        // This route IS protected by authenticationToken and requireDirectorRole
        
        prismaMock.role.findMany.mockResolvedValue([
            { id: 1, name: 'Director', displayName: 'Director' },
            { id: 2, name: 'Agent', displayName: 'Agente' }
        ] as any);

        const response = await request(app).get('/api/v1/auth/roles');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
    });
  });
});
