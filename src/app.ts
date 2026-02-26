import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { PrismaClient } from "../generated/prisma";
import { routerAPI } from "@core/routes";
import { errorHandler, requestLogger } from "@core/middlewares";
import { setupSwagger } from "@core/config/swagger";
import { initUploadsDir } from "@core/config/initUploadsDir";

const prisma = new PrismaClient();

dotenv.config();
const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(morgan("combined"));
app.use(express.json());

initUploadsDir();

app.use(requestLogger);

// Documentación de la API
setupSwagger(app);

routerAPI(app);

app.use(errorHandler);

export { app };
