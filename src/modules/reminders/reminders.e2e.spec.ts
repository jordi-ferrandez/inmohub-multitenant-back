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
}));

describe('Reminder Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/reminders', () => {
    it('should return 200 with list of reminders', async () => {
      prismaMock.reminder.findMany.mockResolvedValue([]);
      prismaMock.reminder.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/reminders');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should support status filter', async () => {
      prismaMock.reminder.findMany.mockResolvedValue([]);
      prismaMock.reminder.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/reminders?status=pending');

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      prismaMock.reminder.findMany.mockResolvedValue([]);
      prismaMock.reminder.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/reminders?page=1&limit=10');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/reminders/:id', () => {
    it('should return 404 if reminder not found', async () => {
      prismaMock.reminder.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/reminders/999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/api/v1/reminders/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/reminders/:id/status', () => {
    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/v1/reminders/1/status')
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid reminder id', async () => {
      const response = await request(app)
        .patch('/api/v1/reminders/invalid/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/reminders/:id/occurrences', () => {
    it('should return 404 if reminder not found', async () => {
      prismaMock.reminder.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/reminders/999/occurrences');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/reminders/:reminderId/occurrences/:occurrenceId', () => {
    it('should return 400 for invalid occurrence id', async () => {
      const response = await request(app)
        .patch('/api/v1/reminders/1/occurrences/invalid')
        .send({ completed: true });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid reminder id', async () => {
      const response = await request(app)
        .patch('/api/v1/reminders/invalid/occurrences/1')
        .send({ completed: true });

      expect(response.status).toBe(400);
    });
  });
});
