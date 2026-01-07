import express from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils";

const testRouter = express.Router();

testRouter.get("/test", (req, res) => {
  res.send("¡Funciona!");
});

testRouter.get("/hc", (req, res) => {
  res.send("¡Funciona HC!");
});

testRouter.get("/ping", async (req, res) => {
  try {
    const record = await prisma.ping.create({ data: { value: "pong" } });
    successResponse(res, { message: "pong", record });
  } catch (error) {
    console.error("Error en /ping:", error);
    errorResponse(res, "Internal Server Error", 500, error);
  }
});

export { testRouter };
