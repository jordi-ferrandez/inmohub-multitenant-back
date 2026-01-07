/**
 * @dav-dmdo
 * the shpae of buildingKey is ass follows `${street}<|>${number}<|>${block}<|>${stair}`
 *
 */

import { BuilindingInCSVDTO } from "../types";

export const getBuildingFromKey = (buildingKey: string) => {
  const splittedKey = buildingKey.split("<|>");
  const building: BuilindingInCSVDTO = {
    street: splittedKey[0],
    number: parseInt(splittedKey[1]),
    block: splittedKey[2] === "null" ? null : splittedKey[2],
    stair: splittedKey[3] === "null" ? null : splittedKey[3],
  };
  return building;
};
