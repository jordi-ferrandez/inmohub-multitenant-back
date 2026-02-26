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

jest.mock('@core/middlewares/roleMiddleware', () => ({
    requireDirectorRole: (req: any, res: any, next: any) => next(),
    requireAgentRole: (req: any, res: any, next: any) => next(),
}));

describe('Property Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/properties', () => {
    it('should return 200 and a list of properties', async () => {
      const mockProperties = [
        { id: 1, number: '1A', floor: 1, inmovillaCode: 100 },
        { id: 2, number: '2B', floor: 2, inmovillaCode: 101 },
      ];

      // PropertyService uses $transaction
      prismaMock.$transaction.mockResolvedValue([mockProperties, 2]);

      const response = await request(app).get('/api/v1/properties');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].number).toBe('1A');
    });
  });

  describe('GET /api/v1/properties/:id', () => {
    it('should return 200 and the property details', async () => {
      const mockProperty = { id: 1, number: '1A', floor: 1 };

      prismaMock.property.findUnique.mockResolvedValue(mockProperty as any);

      const response = await request(app).get('/api/v1/properties/1');

      expect(response.status).toBe(200);
      expect(response.body.data.number).toBe('1A');
    });

    it('should return 500 with descriptive message if property not found (as per current controller behavior)', async () => {
      prismaMock.property.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/properties/999');

      expect(response.status).toBe(500);
      expect(response.body.errorMessage).toContain('No existe una property');
    });
  });

  describe('PATCH /api/v1/properties/:id', () => {
    it('should update the property and return 200', async () => {
      const updatedProperty = { id: 1, number: 'Updated' };

      prismaMock.property.update.mockResolvedValue(updatedProperty as any);

      const response = await request(app)
        .patch('/api/v1/properties/1')
        .send({ number: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.number).toBe('Updated');
    });

    it('should return 400 for invalid fields', async () => {
        const response = await request(app)
          .patch('/api/v1/properties/1')
          .send({ invalidField: 'Value' });
  
        expect(response.status).toBe(400);
      });
  });
});
