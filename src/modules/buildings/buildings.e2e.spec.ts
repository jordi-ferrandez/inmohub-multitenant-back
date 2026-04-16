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
        req.user = { userId: '1', id: 1, email: 'admin@example.com', roles: [{ name: 'Director', displayName: 'Director' }] };
        next();
    },
}));

jest.mock('@core/middlewares/roleMiddleware', () => ({
    requireDirectorRole: (req: any, res: any, next: any) => next(),
    requireAgentRole: (req: any, res: any, next: any) => next(),
}));

describe('Building Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/buildings', () => {
    it('should return 200 and a list of buildings', async () => {
      const mockBuildings = [
        { id: 1, streetName: 'Main St', streetNumber: '100' },
      ];

      prismaMock.$transaction.mockResolvedValue([mockBuildings, 1]);

      const response = await request(app).get('/api/v1/buildings');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it('should support search parameter', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      const response = await request(app).get('/api/v1/buildings?search=main');

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      const response = await request(app).get('/api/v1/buildings?page=1&limit=10');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/buildings/streets', () => {
    it('should return 200 with buildings grouped by streets', async () => {
      prismaMock.building.findMany.mockResolvedValue([
        { streetName: 'Main St', streetNumber: '100' },
      ] as any);

      const response = await request(app).get('/api/v1/buildings/streets');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/buildings', () => {
    it('should create a new building and return 201', async () => {
      const newBuilding = {
        id: 1,
        streetName: 'New St',
        streetNumber: '200',
      };

      prismaMock.building.create.mockResolvedValue(newBuilding as any);

      const response = await request(app)
        .post('/api/v1/buildings')
        .send({
          streetName: 'New St',
          streetNumber: '200',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.streetName).toBe('New St');
    });
  });

  describe('PATCH /api/v1/buildings/:id', () => {
    it('should update building and return 200', async () => {
      const updatedBuilding = { id: 1, streetName: 'Updated St' };

      prismaMock.building.update.mockResolvedValue(updatedBuilding as any);

      const response = await request(app)
        .patch('/api/v1/buildings/1')
        .send({ streetName: 'Updated St' });

      expect(response.status).toBe(200);
      expect(response.body.data.streetName).toBe('Updated St');
    });
  });
});
