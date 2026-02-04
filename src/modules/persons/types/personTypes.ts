import { z } from "zod";

export const phoneTypeEnum = z.enum(["Mobile", "Home", "Work", "Other"]);


export const genderEnum = z.enum(["Masculino", "Femenino", "Otro"]);

export const personPhoneSchema = z.object({
  phone: z
    .string()
    .min(9)
    .max(15)
    .regex(/^\d+$/, "El teléfono debe contener solo números"),
  type: phoneTypeEnum,
});

export const personPhoneUpdateSchema = z.object({
  id: z.number().optional(),
  phone: z
    .string()
    .min(9)
    .max(15)
    .regex(/^\d+$/, "El teléfono debe contener solo números"),
  type: phoneTypeEnum,
});

export const createPersonBodySchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("El email debe ser válido").optional().nullable(),
  birthDate: z.coerce.date().optional(),
  gender: genderEnum.optional(),
  notificationPreference: z
    .enum(["EMAIL", "WHATSAPP", "SMS", "NONE"])
    .optional(),
  phones: z.array(personPhoneSchema).optional(),
});

export const updatePersonBodySchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").optional(),
  lastName: z.string().min(1, "El apellido es requerido").optional(),
  email: z.string().email("El email debe ser válido").optional(),
  birthDate: z.coerce.date().optional(),
  gender: genderEnum.optional(),
  notificationPreference: z
    .enum(["EMAIL", "WHATSAPP", "SMS", "NONE"])
    .optional(),
  phones: z.array(personPhoneUpdateSchema).optional(),
});

export const getPersonsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  search: z.string().optional(),
});

export const searchPersonsQuerySchema = z.object({
  q: z.string().min(1, "El término de búsqueda es requerido"),
});

export const assignPropertyBodySchema = z.object({
  role: z.enum(["owner", "tenant"], {
    errorMap: () => ({ message: "Rol inválido. Debe ser 'owner' o 'tenant'" }),
  }),
});

export const unassignPropertyBodySchema = z.object({
  role: z.enum(["owner", "tenant"], {
    errorMap: () => ({ message: "Rol inválido. Debe ser 'owner' o 'tenant'" }),
  }),
});

export type CreatePersonBody = z.infer<typeof createPersonBodySchema>;
export type UpdatePersonBody = z.infer<typeof updatePersonBodySchema>;
export type GetPersonsQuery = z.infer<typeof getPersonsQuerySchema>;
export type SearchPersonsQuery = z.infer<typeof searchPersonsQuerySchema>;
export type PersonPhoneInput = z.infer<typeof personPhoneSchema>;
export type PersonPhoneUpdateInput = z.infer<typeof personPhoneUpdateSchema>;
export type AssignPropertyBody = z.infer<typeof assignPropertyBodySchema>;
export type UnassignPropertyBody = z.infer<typeof unassignPropertyBodySchema>;

export type PhoneType = z.infer<typeof phoneTypeEnum>;
