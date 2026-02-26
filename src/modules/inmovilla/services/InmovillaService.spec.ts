import { InmovillaService } from './InmovillaService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';
import { BatchProcessor } from '@core/utils/BatchProcessor';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

jest.mock('@core/utils/BatchProcessor', () => ({
  BatchProcessor: {
    processInBatchesWithErrorHandling: jest.fn(),
  }
}));

describe('InmovillaService', () => {
    let inmovillaService: InmovillaService;
    const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

    beforeEach(() => {
        mockReset(prismaMock);
        inmovillaService = new InmovillaService();
        jest.clearAllMocks();
    });

    describe('importFromCSV', () => {
        it('should process CSV data and return results summary', async () => {
            const mockParsedData = {
                totalRecords: 1,
                buildingsMap: new Map([
                    ['building1', { 
                        building: { street: 'Main St', number: 123 },
                        propertiesWithRelations: [],
                        firstRowNumber: 1
                    }]
                ]),
                csvVersion: 'v3',
                parsingErrors: []
            };

            (BatchProcessor.processInBatchesWithErrorHandling as jest.Mock).mockResolvedValue([
                { buildingCreated: true, buildingExisting: false }
            ]);

            const result = await inmovillaService.importFromCSV(mockParsedData as any);

            expect(result.totalRecords).toBe(1);
            expect(result.buildingsCreated).toBe(1);
        });
    });

    describe('processBuilding', () => {
        it('should create a new building if it does not exist', async () => {
            const buildingUnit = {
                building: { street: 'New St', number: 456 },
                propertiesWithRelations: []
            };
            const response = { errors: [] } as any;

            prismaMock.building.findFirst.mockResolvedValue(null);
            prismaMock.building.create.mockResolvedValue({ id: 10, street: 'New St', number: 456 } as any);
            (BatchProcessor.processInBatchesWithErrorHandling as jest.Mock).mockResolvedValue([]);

            const result = await (inmovillaService as any).processBuilding(buildingUnit as any, response);

            expect(result.buildingCreated).toBe(true);
            expect(prismaMock.building.create).toHaveBeenCalled();
        });
    });
});
