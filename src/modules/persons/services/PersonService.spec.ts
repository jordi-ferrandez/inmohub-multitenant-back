import { PersonService } from './PersonService';
import { prisma } from '@core/lib';
import { mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@generated/prisma';

jest.mock('@core/lib', () => ({
  prisma: require('jest-mock-extended').mockDeep(),
}));

describe('PersonService', () => {
  let personService: PersonService;
  const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(prismaMock);
    personService = new PersonService();
  });

  describe('createPerson', () => {
    it('should create a person successfully', async () => {
      const personInput = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phones: [{ phone: '123456789', type: 'mobile' }]
      };

      prismaMock.person.findUnique.mockResolvedValue(null);
      prismaMock.person.create.mockResolvedValue({ id: 1, ...personInput } as any);

      const result = await personService.createPerson(personInput as any);

      expect(result.id).toBe(1);
      expect(prismaMock.person.create).toHaveBeenCalled();
    });
  });

  describe('getPersonRelations', () => {
    it('should return person relations if found', async () => {
      prismaMock.person.findUnique.mockResolvedValue({ id: 1, firstName: 'John', lastName: 'Doe' } as any);
      prismaMock.building.findMany.mockResolvedValue([]);
      prismaMock.property.findMany.mockResolvedValue([]);

      const result = await personService.getPersonRelations(1);
      
      expect(result.presidentBuildings).toBeInstanceOf(Array);
      expect(result.ownerProperties).toBeInstanceOf(Array);
      expect(prismaMock.person.findUnique).toHaveBeenCalled();
    });

    it('should throw error if person not found', async () => {
      prismaMock.person.findUnique.mockResolvedValue(null);

      await expect(personService.getPersonRelations(999))
        .rejects.toThrow('Persona no encontrada');
    });
  });
});
