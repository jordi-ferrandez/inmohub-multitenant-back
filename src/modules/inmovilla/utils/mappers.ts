import { record } from "zod";
import {
  BuilindingInCSVDTO,
  CaptadorInCSVDTO,
  ClientInCSVDTO,
  InmovillaCSVRecord,
  PropertyInCSVDTO,
} from "../types";

export const mapBuilding = (record: InmovillaCSVRecord): BuilindingInCSVDTO => {
  return {
    street: record["Calle Prop"],
    number: record["Calle Prop Num"],
    block: record["Calle Bloque"],
    stair: record["Calle Prop esc"],
  };
};

export const mapProperty = (record: InmovillaCSVRecord): PropertyInCSVDTO => {
  let occupiedBy: string | null = null;
  if (record["PROPIETARIO OCUPADO"]) occupiedBy = "owner";
  else if (record["INQUILINO OCUPADO"]) occupiedBy = "tenant";
  else if (record["PISO VACIO"]) occupiedBy = "none";

  return {
    inmovillaCode: record["Codigo"],
    number: record["Puerta"],
    floor: record["Calle prop Planta"],
    appraisalPrice: record["Valoracion"] || null,
    occupiedBy: occupiedBy,
    importantNotice: record["Aviso Importante Cliente"] || null,
    rso_comment: record["Observación Cliente"] || null,
    soldRentedUs: !!(record["ALQUILADO EVERLY"] || record["VENDIDO EVERLY"]),
    branch: String(record["Sucursal Captador"]) || null,
  };
};
export const mapClient = (record: InmovillaCSVRecord): ClientInCSVDTO => {
  return {
    firstName: record["Nombre Cliente"],
    lastName: record["Apellidos"],
    email: record["Email Cliente"],
    mobilePhone: record["Telf. Movil Cliente"],
    telephone: record["Teléfono Cliente"],
    isInformer: record["INFORMADOR"] === 1,
  };
};

export const mapCaptador = (record: InmovillaCSVRecord): CaptadorInCSVDTO => ({
  firstName: record["Nombre Captador"],
  lastName: record["Apellidos Captador"],
  branch: String(record["Sucursal Captador"]) || null,
  closedBy: record["Cerrado por"] || null,
  employee: record["Colaborador"] || null,
});
