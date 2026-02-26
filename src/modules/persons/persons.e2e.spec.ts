import request from 'supertest';
import { app } from '../../app';
import { prisma } from '@core/lib';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

// Mock the prisma instance used by the app
jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

// Mock middlewares
jest.mock('@core/middlewares/authenticationToken', () => ({
    authenticationToken: (req: any, res: any, next: any) => {
        req.user = { id: 1, email: 'admin@example.com', roles: [{ name: 'admin', displayName: 'Admin' }] };
        next();
    },
}));

describe('Person Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/persons', () => {
    it('should return 200 and a list of persons', async () => {
      const mockPersons = [
        { 
            id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com',
            propertiesOwned: [], propertiesTenanted: [], presidentBuildings: [], informerBuildings: [], contactBuildings: []
        },
      ];

      prismaMock.person.findMany.mockResolvedValue(mockPersons as any);
      prismaMock.person.count.mockResolvedValue(1);

      const response = await request(app).get('/api/v1/persons');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(1);
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

      prismaMock.person.findUnique.mockResolvedValue(null); // uniqueness check
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
  });

  describe('DELETE /api/v1/persons/:id', () => {
    it('should delete (soft delete) the person and return 200 (as per current controller behavior)', async () => {
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
