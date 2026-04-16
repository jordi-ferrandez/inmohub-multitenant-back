import request from 'supertest';
import { app } from '../../app';
import { prisma } from '@core/lib';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('@core/middlewares/authenticationToken', () => ({
    authenticationToken: (req: any, res: any, next: any) => {
        req.user = { userId: '1', id: 1, email: 'director@example.com', roles: [{ name: 'Director', displayName: 'Director' }] };
        next();
    },
}));

jest.mock('@core/middlewares/roleMiddleware', () => ({
    requireDirectorRole: (req: any, res: any, next: any) => next(),
    requireAgentRole: (req: any, res: any, next: any) => next(),
    requireAgentOrDirectorRole: (req: any, res: any, next: any) => next(),
}));

describe('FollowUp Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/followups', () => {
    it('should return 200 with list of followups', async () => {
      prismaMock.followUp.findMany.mockResolvedValue([]);
      prismaMock.followUp.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/followups');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should support pagination', async () => {
      prismaMock.followUp.findMany.mockResolvedValue([]);
      prismaMock.followUp.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/followups?page=1&limit=10');

      expect(response.status).toBe(200);
    });

    it('should support status filter', async () => {
      prismaMock.followUp.findMany.mockResolvedValue([]);
      prismaMock.followUp.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/followups?status=pending');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/followups/:id', () => {
    it('should return 404 if followup not found', async () => {
      prismaMock.followUp.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/followups/999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/followups/directors/overview', () => {
    it('should return 403 if user is not director', async () => {
      jest.doMock('@core/middlewares/authenticationToken', () => ({
          authenticationToken: (req: any, res: any, next: any) => {
              req.user = { userId: '2', id: 2, email: 'agent@example.com', roles: [{ name: 'Agent', displayName: 'Agente' }] };
              next();
          },
      }));

      const response = await request(app).get('/api/v1/followups/directors/overview');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/followups/planned', () => {
    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app).get('/api/v1/followups/planned');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/followups/completed', () => {
    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app).get('/api/v1/followups/completed');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/followups/stats/overview', () => {
    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app).get('/api/v1/followups/stats/overview');

      expect(response.status).toBe(400);
    });
  });
});
