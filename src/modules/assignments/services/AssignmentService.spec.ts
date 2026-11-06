import { assignmentService } from './AssignmentService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from './../../../generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('AssignmentService', () => {
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createAssignment', () => {
    it('should create an assignment successfully', async () => {
      const input = {
        userId: 1,
        buildingId: 10,
        type: 'Following' as any,
        startDate: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.building.findUnique.mockResolvedValue({ id: 10 } as any);
      prismaMock.assignment.findFirst.mockResolvedValue(null);
      prismaMock.assignment.create.mockResolvedValue({ id: 100, ...input } as any);

      const result = await assignmentService.createAssignment(input, null);

      expect(result.id).toBe(100);
      expect(prismaMock.assignment.create).toHaveBeenCalled();
    });
  });

  describe('getAssignments', () => {
    it('should return paginated assignments', async () => {
      prismaMock.assignment.findMany.mockResolvedValue([]);
      prismaMock.assignment.count.mockResolvedValue(0);

      const result = await assignmentService.getAssignments({ page: 1, limit: 10 }, null);

      expect(result.status).toBe('success');
      expect(result.metadata.totalItems).toBe(0);
    });

    it('should apply tenant filter for company A', async () => {
      prismaMock.assignment.findMany.mockResolvedValue([]);
      prismaMock.assignment.count.mockResolvedValue(0);

      await assignmentService.getAssignments({ page: 1, limit: 10 }, 1);

      expect(prismaMock.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { companyId: 1 },
            building: { companyId: 1 },
          }),
        })
      );
    });

    it('should not leak tenant filter to company B when scoped to A', async () => {
      prismaMock.assignment.findMany.mockResolvedValue([]);
      prismaMock.assignment.count.mockResolvedValue(0);

      await assignmentService.getAssignments({ page: 1, limit: 10 }, 1);

      const where = (prismaMock.assignment.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.user.companyId).toBe(1);
      expect(where.user.companyId).not.toBe(2);
    });
  });

  describe('createAssignment tenant isolation', () => {
    it('should reject user from another company', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, companyId: 2 } as any);
      await expect(
        assignmentService.createAssignment(
          { userId: 1, buildingId: 10, type: 'Following' as any, startDate: new Date() },
          1
        )
      ).rejects.toThrow('Usuario no pertenece a la empresa');
    });

    it('should reject building from another company', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, companyId: 1 } as any);
      prismaMock.building.findUnique.mockResolvedValue({ id: 10, companyId: 2 } as any);
      await expect(
        assignmentService.createAssignment(
          { userId: 1, buildingId: 10, type: 'Following' as any, startDate: new Date() },
          1
        )
      ).rejects.toThrow('Edificio no pertenece a la empresa');
    });
  });
});
