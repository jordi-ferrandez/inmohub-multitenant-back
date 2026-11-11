import { app } from './app';
import { prisma } from '@core/lib/prisma';
import { ensureSuperadmin } from '@core/bootstrap/ensureSuperadmin';
import { envConfig } from '@core/config/env';

const port = envConfig.PORT;
const host = envConfig.HOST;

const server = app.listen(port, host, () => {
  console.log(`🚀 Backend corriendo en http://${host}:${port}`);
  console.log(`📚 Documentación disponible en http://${host}:${port}/api/docs`);
  console.log(
    `❤️  Health check disponible en http://${host}:${port}/api/health`,
  );

  // Bootstrap: asegurar que exista un Superadmin al arrancar.
  // No bloquea la escucha del servidor; si la BD no está disponible
  // se loguea el error y el servidor sigue funcionando.
  void ensureSuperadmin().catch((error) => {
    console.error(
      '❌ Bootstrap: no se pudo verificar/crear el Superadmin:',
      error,
    );
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string, exitCode = 0) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }

    process.exit(exitCode);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  void gracefulShutdown('unhandledRejection', 1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  void gracefulShutdown('uncaughtException', 1);
});

export { server };
