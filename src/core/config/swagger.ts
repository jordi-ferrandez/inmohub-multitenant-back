import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inmohub API',
      version: '1.0.0',
      description:
        'Documentación técnica de la API de Inmohub para gestión inmobiliaria.',
      contact: {
        name: 'Soporte Técnico Inmohub',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Public API access using Enterprise API Key',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/routes/*.ts',
    './src/modules/**/controllers/*.ts',
    './dist/modules/**/routes/*.js',
    './dist/modules/**/controllers/*.js',
  ], // Archivos donde buscaremos documentación
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log(
    '📄 Swagger documentation available at http://localhost:4000/api/docs',
  );
};
