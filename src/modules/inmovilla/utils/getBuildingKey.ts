import { BuilindingInCSVDTO } from "../types";

export const getBuildingKey = (building: BuilindingInCSVDTO): string => {
  const { street, number, block, stair } = building;
  return `${street}<|>${number}<|>${block}<|>${stair}`;
};
