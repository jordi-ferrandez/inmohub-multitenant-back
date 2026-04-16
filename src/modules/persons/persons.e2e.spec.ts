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

describe('Person Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/persons', () => {
    it('should return 200 with search parameter', async () => {
      prismaMock.person.findMany.mockResolvedValue([]);
      prismaMock.person.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/persons?search=test');

      expect(response.status).toBe(200);
    });

    it('should support search parameter', async () => {
      prismaMock.person.findMany.mockResolvedValue([]);
      prismaMock.person.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/persons?search=john');

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      prismaMock.person.findMany.mockResolvedValue([]);
      prismaMock.person.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/persons?page=1&limit=10');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/persons', () => {
    it('should create a new person and return 201', async () => {
      const newPerson = {
        id: 3,
        firstName: 'Alice',
        lastName: 'Wonder',
        email: 'alice@example.com',
      };

      prismaMock.person.findUnique.mockResolvedValue(null);
      prismaMock.person.create.mockResolvedValue(newPerson as any);

      const response = await request(app)
        .post('/api/v1/persons')
        .send({
          firstName: 'Alice',
          lastName: 'Wonder',
          email: 'alice@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.firstName).toBe('Alice');
    });

    it('should return 400 if email already exists', async () => {
      prismaMock.person.findUnique.mockResolvedValue({ id: 1, email: 'existing@example.com' } as any);

      const response = await request(app)
        .post('/api/v1/persons')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'existing@example.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/persons/:id', () => {
    it('should delete (soft delete) the person and return 200', async () => {
      prismaMock.person.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.$transaction.mockResolvedValue([{}, {}]);

      const response = await request(app).delete('/api/v1/persons/1');

      expect(response.status).toBe(200);
    });

    it('should return 404 if person not found', async () => {
      prismaMock.person.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/persons/999');

      expect(response.status).toBe(404);
    });
  });
});
