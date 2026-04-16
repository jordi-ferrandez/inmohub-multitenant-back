import request from 'supertest';
import { app } from '../../app';
import { prisma } from '@core/lib';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

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

jest.mock('@core/services/MailerService', () => ({
    MailerService: jest.fn().mockImplementation(() => ({
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    })),
}));

describe('Auth Endpoints (E2E)', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 400 if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@example.com' } as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Existing',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 for invalid credentials', async () => {
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

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 for existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'user@example.com' } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('Si el email existe');
    });

    it('should return 200 even for non-existing email (security)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 400 for expired token', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 1,
        resetToken: 'expired-token',
        resetTokenExp: new Date(Date.now() - 3600000),
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'expired-token',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 1,
        emailVerificationToken: 'valid-token',
        emailVerificationExp: new Date(Date.now() + 3600000),
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const response = await request(app)
        .get('/api/v1/auth/verify-email?token=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('verificado correctamente');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/auth/verify-email?token=invalid-token');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 400 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should return 400 for incorrect old password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          oldPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing oldPassword', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/auth/onboarding', () => {
    it('should return 400 for missing tourId', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/onboarding')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/roles', () => {
    it('should return 200 and roles list', async () => {
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

  describe('GET /api/v1/auth/users', () => {
    it('should return empty list when no users exist', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const response = await request(app).get('/api/v1/auth/users');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should support pagination parameters', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/auth/users?page=2&limit=10');

      expect(response.status).toBe(200);
    });

    it('should support role filter', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/auth/users?role=Agent');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/auth/users/search', () => {
    it('should return 200 with empty array for empty search', async () => {
      const response = await request(app)
        .get('/api/v1/auth/users/search?search=');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 200 with empty array for whitespace search', async () => {
      const response = await request(app)
        .get('/api/v1/auth/users/search?search=   ');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/auth/users/:id', () => {
    it('should return 200 and user details', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [{ id: 1, name: 'Agent', displayName: 'Agente', role: { id: 1, name: 'Agent', displayName: 'Agente' } }],
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const response = await request(app).get('/api/v1/auth/users/1');

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('user@example.com');
    });

    it('should return 404 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/auth/users/999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app).get('/api/v1/auth/users/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/users', () => {
    it('should return 400 if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@example.com' } as any);

      const response = await request(app)
        .post('/api/v1/auth/users')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Existing',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/users')
        .send({
          email: 'new@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/auth/users/:id', () => {
    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/auth/users/999')
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/v1/auth/users/invalid')
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/auth/users/:id', () => {
    it('should return 200 when user is deleted', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const response = await request(app).delete('/api/v1/auth/users/1');

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('eliminado');
    });

    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/auth/users/999');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/auth/users/:id/roles', () => {
    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/auth/users/999/roles')
        .send({ roleIds: [1] });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/v1/auth/users/invalid/roles')
        .send({ roleIds: [1] });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/users/:id/reset-onboarding', () => {
    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/users/999/reset-onboarding');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/users/invalid/reset-onboarding');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/users/:id/password', () => {
    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/users/999/password')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/users/invalid/password')
        .send({ newPassword: 'NewPassword123!' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing newPassword', async () => {
      const response = await request(app)
        .post('/api/v1/auth/users/1/password')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/users/:id/send-reset-link', () => {
    it('should return 400 if user not found (validation fails)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/users/999/send-reset-link');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/users/invalid/send-reset-link');

      expect(response.status).toBe(400);
    });
  });
});
