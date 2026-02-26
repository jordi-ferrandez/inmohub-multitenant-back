import { PrismaClient } from "./../../../generated/prisma";

class PrismaClientSingleton {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
      });

      // Manejar cierre limpio
      process.on("beforeExit", async () => {
        await PrismaClientSingleton.instance.$disconnect();
      });
    }

    return PrismaClientSingleton.instance;
  }
}

const prisma = PrismaClientSingleton.getInstance();
export { prisma };
