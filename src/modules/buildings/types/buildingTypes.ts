import { z } from "zod";
import { Property } from "./../../../../generated/prisma";

export type CreateBuildingDTO = {
  street: string;
  number: number;
  block: string;
  stair: string;
};

export type UpdateBuildingDTO = Partial<CreateBuildingDTO>;

export type BuildingResponseDTO = {
  id: number;
  street: string;
  number: number;
  block: string;
  stair: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Property[];
};

export type BuildingsGroupedByStreetDTO = {
  street: string;
  buildings: BuildingResponseDTO[];
};

export type GetBuildingsGroupedByStreetsDTO = BuildingsGroupedByStreetDTO[];

export const getBuildingsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  street: z.string().optional(),
  number: z.coerce.number().int().positive().optional(),
  block: z.string().optional(),
  stair: z.string().optional(),
});

export type GetBuildingsQuery = z.infer<typeof getBuildingsQuerySchema>;

export const getBuildingsByStreetNameParamsSchema = z.object({
  name: z.string().min(1),
});
export type GetBuildingsByStreetNameParams = z.infer<
  typeof getBuildingsByStreetNameParamsSchema
>;

export const getBuildingsByStreetNameQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export type GetBuildingsByStreetNameQuery = z.infer<
  typeof getBuildingsByStreetNameQuerySchema
>;

export const getBuildingByIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetBuildingByIdParams = z.infer<typeof getBuildingByIdParamsSchema>;

export const getBuildingMailboxingsParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetBuildingMailboxingsParams = z.infer<
  typeof getBuildingMailboxingsParamsSchema
>;

export const getBuildingMailboxingsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  mailboxerId: z.coerce.number().int().positive().optional(),
  status: z.enum(["inside", "outside", "no_disturb"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type GetBuildingMailboxingsQuery = z.infer<
  typeof getBuildingMailboxingsQuerySchema
>;