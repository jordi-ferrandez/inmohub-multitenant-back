# InmoHub Backend ⚙️

Este es el núcleo de **InmoHub**, una API robusta y modular diseñada para gestionar operaciones inmobiliarias complejas. Construida con un enfoque en la seguridad de datos, escalabilidad y facilidad de mantenimiento.

## 🚀 Tecnologías Principales

- **Runtime:** [Node.js](https://nodejs.org/) con [TypeScript](https://www.typescriptlang.org/).
- **Framework:** [Express.js v5.x](https://expressjs.com/) (versión moderna y asíncrona).
- **ORM:** [Prisma v6+](https://www.prisma.io/).
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/).
- **Validación:** [Zod](https://zod.dev/) para esquemas rigurosos en peticiones y respuestas.
- **Autenticación:** [JSON Web Tokens (JWT)](https://jwt.io/) con roles (`RBAC`).
- **Almacenamiento:** Integración con **AWS S3** para adjuntos (Propiedades, Mailboxing).
- **Inteligencia Artificial:** OCR integrado con [Tesseract.js](https://tesseract.projectnaptha.com/) para escaneo de documentos.
- **Documentación:** [Swagger (OpenAPI v3.0)](https://swagger.io/).
- **E-mail:** [Nodemailer](https://nodemailer.com/).

---

## 🛠️ Configuración Inicial

Para poner en marcha el backend en local:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar el entorno:**
    Crea un archivo `.env` basado en `.env.develop` y configura tu cadena de conexión a PostgreSQL.
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/inmohub"
    JWT_SECRET="tu_secreto_super_seguro"
    ```

3.  **Generar el cliente de Prisma y correr migraciones:**
    ```bash
    npm run prisma:generate
    npm run prisma:migrate
    ```

4.  **Poblar la base de datos (Seed):**
    ```bash
    npm run prisma:seed
    ```

5.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

---

## 📂 Arquitectura Modular

El proyecto utiliza una estructura basada en módulos funcionales dentro de `src/modules/`. Cada módulo es autónomo y responsable de un área del negocio:

- `controllers/`: Manejo de las peticiones HTTP (entrada/salida).
- `services/`: Lógica de negocio core y llamadas a Prisma.
- `routes/`: Definición de endpoints y exposición del módulo.
- `validators/`: Esquemas de Zod para sanitizar la entrada de datos.
- `types/`: Definiciones TypeScript específicas del módulo.

### Carpetas Principales
- `src/core/`: Utilidades compartidas, middlewares globales y configuración base.
- `src/generated/`: Cliente de Prisma generado automáticamente.
- `prisma/`: Esquema de base de datos y scripts de seed.

---

## 📝 Reglas de la API

Es **IMPRESCINDIBLE** seguir las normas de respuesta estandarizadas para asegurar la compatibilidad con el frontend. Todas las respuestas deben usar los helpers de éxito o error.

Consulta el archivo: [API_RESPONSE_RULES.md](./API_RESPONSE_RULES.md) para ver ejemplos detallados.

---

## 📖 Documentación (Swagger)

Una vez que el servidor esté corriendo, puedes explorar y probar la API en:
`http://localhost:3000/api-docs`

---

## 🐳 Docker

El proyecto está preparado para ejecutarse con Docker:
```bash
docker-compose up --build
```

---

© 2026 InmoHub Team.
