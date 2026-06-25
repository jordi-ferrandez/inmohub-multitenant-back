import { WordPressService } from './WordPressService';

const mockPrisma = {
  building: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  property: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  person: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  followUp: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  personPhone: { create: jest.fn() },
  user: { findFirst: jest.fn() },
};

jest.mock('./../../../../generated/prisma', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('WordPressService', () => {
  let service: WordPressService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.building.count.mockResolvedValue(0);
    mockPrisma.property.count.mockResolvedValue(0);
    mockPrisma.person.count.mockResolvedValue(0);
    mockPrisma.followUp.count.mockResolvedValue(0);
    service = new WordPressService();
  });

  describe('stats', () => {
    it('should return aggregate counts', async () => {
      mockPrisma.building.count.mockResolvedValue(10);
      mockPrisma.property.count.mockResolvedValue(50);
      mockPrisma.person.count.mockResolvedValue(100);
      mockPrisma.followUp.count.mockResolvedValue(200);

      const result = await service.stats();

      expect(result.totalBuildings).toBe(10);
      expect(result.totalProperties).toBe(50);
      expect(result.totalPersons).toBe(100);
      expect(result.totalFollowUps).toBe(200);
    });
  });

  describe('importFromJson', () => {
    it('should return error for invalid format', async () => {
      const result = await service.importFromJson({});
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Formato de JSON incorrecto');
    });

    it('should process buildings and properties', async () => {
      mockPrisma.building.findFirst.mockResolvedValue(null);
      mockPrisma.building.create.mockResolvedValue({ id: 1 });
      mockPrisma.property.findFirst.mockResolvedValue(null);
      mockPrisma.property.create.mockResolvedValue({ id: 1 });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const data = {
        wprm_rso_edificio: [
          { id: '1', calle: 'Calle Mayor', numero: '10' },
        ],
        wprm_rso_puerta: [
          { id: '1', id_edificio: '1', codigo_inmovilla: '100', numero_puerta: 'A', planta: '1' },
        ],
      };

      const result = await service.importFromJson(data as any);

      expect(result.buildingsCreated).toBe(1);
      expect(result.propertiesImported).toBe(1);
      expect(mockPrisma.building.create).toHaveBeenCalled();
      expect(mockPrisma.property.create).toHaveBeenCalled();
    });
  });
});
