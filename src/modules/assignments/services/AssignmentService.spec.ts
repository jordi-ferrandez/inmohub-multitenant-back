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

      const result = await assignmentService.createAssignment(input);

      expect(result.id).toBe(100);
      expect(prismaMock.assignment.create).toHaveBeenCalled();
    });
  });

  describe('getAssignments', () => {
    it('should return paginated assignments', async () => {
      prismaMock.assignment.findMany.mockResolvedValue([]);
      prismaMock.assignment.count.mockResolvedValue(0);

      const result = await assignmentService.getAssignments({ page: 1, limit: 10 });

      expect(result.status).toBe('success');
      expect(result.metadata.totalItems).toBe(0);
    });
  });
});
