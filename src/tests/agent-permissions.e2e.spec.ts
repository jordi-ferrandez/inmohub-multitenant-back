import request from 'supertest';
import { app } from '../app';
import { prisma } from '@core/lib';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../generated/prisma';

// Mock the prisma instance
jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

// We will dynamically override the user mock for each test
let mockUser: any = { id: 1, email: 'director@example.com', roles: [{ name: 'Director' }] };

jest.mock('@core/middlewares/authenticationToken', () => ({
    authenticationToken: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
    },
}));

describe('Agent Permissions & Restrictions (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property Access for Agents', () => {
    beforeEach(() => {
      mockUser = { userId: '2', email: 'agent@example.com', roles: [{ name: 'Agent' }] };
    });

    it('should allow agents to view property details (including prices and persons)', async () => {
      const mockProperty = { 
        id: 1, 
        number: '1A', 
        floor: 1,
        appraisalPrice: 100000,
        propertyPersons: []
      };

      prismaMock.property.findUnique.mockResolvedValue(mockProperty as any);

      const response = await request(app).get('/api/v1/properties/1');

      expect(response.status).toBe(200);
      expect(response.body.data.appraisalPrice).toBe(100000);
    });

    it('should allow agents to edit property number and floor', async () => {
      const updatedProperty = { id: 1, number: '2B', floor: 2 };
      prismaMock.property.update.mockResolvedValue(updatedProperty as any);

      const response = await request(app)
        .patch('/api/v1/properties/1')
        .send({ number: '2B', floor: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.number).toBe('2B');
    });

    it('should deny agents from deleting properties', async () => {
      const response = await request(app).delete('/api/v1/properties/1');

      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Se requiere rol de Director');
    });
  });

  describe('Reminders Access for Agents', () => {
    beforeEach(() => {
      mockUser = { userId: '2', email: 'agent@example.com', roles: [{ name: 'Agent' }] };
    });

    it('should deny agents from viewing reminders list', async () => {
      const response = await request(app).get('/api/v1/reminders');

      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Se requiere rol de Director');
    });

    it('should deny agents from creating reminders', async () => {
      const response = await request(app)
        .post('/api/v1/reminders')
        .send({ title: 'New Reminder' });

      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Se requiere rol de Director');
    });
  });

  describe('Persons Access for Agents', () => {
    beforeEach(() => {
      mockUser = { userId: '2', email: 'agent@example.com', roles: [{ name: 'Agent' }] };
    });

    it('should allow agents to search and view persons', async () => {
      prismaMock.person.findMany.mockResolvedValue([]);
      const response = await request(app).get('/api/v1/persons');
      expect(response.status).toBe(200);
    });

    it('should deny agents from deleting persons', async () => {
      const response = await request(app).delete('/api/v1/persons/1');
      expect(response.status).toBe(403);
    });

    it('should deny agents from assigning/unassigning persons to properties', async () => {
      const responseAssign = await request(app).post('/api/v1/persons/1/properties/1');
      expect(responseAssign.status).toBe(403);

      const responseUnassign = await request(app).delete('/api/v1/persons/1/properties/1');
      expect(responseUnassign.status).toBe(403);
    });
  });

  describe('Assignments Access for Agents', () => {
    beforeEach(() => {
      mockUser = { userId: '2', email: 'agent@example.com', roles: [{ name: 'Agent' }] };
    });

    it('should allow agents to view their assignments', async () => {
      prismaMock.assignment.findMany.mockResolvedValue([]);
      const response = await request(app).get('/api/v1/assignments');
      expect(response.status).toBe(200);
    });

    it('should deny agents from creating or deleting assignments', async () => {
      const responseCreate = await request(app).post('/api/v1/assignments').send({});
      expect(responseCreate.status).toBe(403);

      const responseDelete = await request(app).delete('/api/v1/assignments/1');
      expect(responseDelete.status).toBe(403);
    });
  });

  describe('Director Access', () => {
    beforeEach(() => {
      mockUser = { userId: '1', email: 'director@example.com', roles: [{ name: 'Director' }] };
    });

    it('should allow directors to access reminders', async () => {
      prismaMock.reminder.findMany.mockResolvedValue([]);
      prismaMock.reminder.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/reminders');

      expect(response.status).toBe(200);
    });

    it('should allow directors to delete properties', async () => {
      prismaMock.property.update.mockResolvedValue({ id: 1, deletedAt: new Date() } as any);

      const response = await request(app).delete('/api/v1/properties/1');

      expect(response.status).toBe(200);
    });

    it('should allow directors to delete persons and manage assignments', async () => {
      prismaMock.person.findUnique.mockResolvedValue({ id: 1, deletedAt: null } as any);
      prismaMock.person.update.mockResolvedValue({ id: 1 } as any);
      prismaMock.personPhone.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.$transaction.mockResolvedValue([{ count: 1 }, { id: 1 }]);
      
      const responsePerson = await request(app).delete('/api/v1/persons/1');
      expect(responsePerson.status).toBe(200);

      prismaMock.user.findUnique.mockResolvedValue({ id: 2, roles: [] } as any);
      prismaMock.building.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.assignment.findFirst.mockResolvedValue(null);
      prismaMock.assignment.create.mockResolvedValue({ id: 1 } as any);

      const responseAssign = await request(app)
        .post('/api/v1/assignments')
        .send({ 
          userId: 2, 
          buildingId: 1, 
          type: 'Following', 
          startDate: '2026-04-06' 
        });
      expect(responseAssign.status).toBe(201);
    });
  });
});
