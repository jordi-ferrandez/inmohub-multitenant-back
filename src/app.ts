import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "../generated/prisma";
import { routerAPI } from "@core/routes";
import { errorHandler, requestLogger } from "@core/middlewares";
import { setupSwagger } from "@core/config/swagger";
import { initUploadsDir } from "@core/config/initUploadsDir";
import { successResponse } from "@core/utils";
import { envConfig } from "@core/config/env";

const prisma = new PrismaClient();

dotenv.config();
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = envConfig.ALLOWED_ORIGINS?.split(",") || ["*"];
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes except health check and docs
app.use((req, res, next) => {
  if (req.path === "/api/health" || req.path.startsWith("/api/docs")) {
    return next();
  }
  return limiter(req, res, next);
});

// Request logging
app.use(morgan("combined"));

initUploadsDir();

app.use(requestLogger);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    successResponse(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch (error) {
    successResponse(res, {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "disconnected",
    }, 503);
  }
});

// API Documentation
setupSwagger(app);

// API Routes
routerAPI(app);

// Global error handler
app.use(errorHandler);

export { app };
