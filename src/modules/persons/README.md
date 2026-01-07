# API de Gestión de Personas

Este módulo proporciona endpoints completos para la gestión de personas en el sistema InmoHub.

## Endpoints Disponibles

### 1. GET /api/v1/persons

Lista personas con paginación y búsqueda.

**Query Parameters:**

- `search` (opcional): Término de búsqueda para filtrar por nombre, apellido o email
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 50)

**Ejemplo:**

```bash
GET /api/v1/persons?search=Juan&page=1&limit=10
```

### 2. GET /api/v1/persons/search

Búsqueda rápida de personas (máximo 20 resultados).

**Query Parameters:**

- `q` (requerido): Término de búsqueda

**Ejemplo:**

```bash
GET /api/v1/persons/search?q=Juan
```

### 3. POST /api/v1/persons

Crear una nueva persona.

**Request Body:**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@email.com",
  "birthDate": "1990-05-15",
  "gender": "Masculino",
  "phones": [
    {
      "phone": "123456789",
      "type": "Mobile"
    }
  ]
}
```

### 4. PATCH /api/v1/persons/:id

Actualizar una persona existente.

**Request Body (todos los campos opcionales):**

```json
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García",
  "email": "juan.carlos@email.com",
  "birthDate": "1990-05-15",
  "gender": "Masculino",
  "phones": [
    {
      "id": 1,
      "phone": "123456789",
      "type": "Mobile"
    },
    {
      "phone": "555555555",
      "type": "Work"
    }
  ]
}
```

### 5. DELETE /api/v1/persons/:id

Eliminar una persona (soft delete).

**Ejemplo:**

```bash
DELETE /api/v1/persons/1
```

### 6. POST /api/v1/persons/:id/properties/:propertyId

Asignar una persona a una propiedad.

**Request Body:**

```json
{
  "role": "owner"
}
```

**Roles disponibles:**

- `owner`: Propietario
- `tenant`: Inquilino

### 7. DELETE /api/v1/persons/:id/properties/:propertyId

Desasignar una persona de una propiedad.

**Request Body:**

```json
{
  "role": "owner"
}
```

## Validaciones

### Campos Requeridos

- `firstName`: Nombre (mínimo 1 carácter)
- `lastName`: Apellido (mínimo 1 carácter)
- `email`: Email válido y único

### Campos Opcionales

- `birthDate`: Fecha de nacimiento en formato ISO (YYYY-MM-DD)
- `gender`: Solo "Masculino", "Femenino" o "Otro"
- `phones`: Array de teléfonos

### Validaciones de Teléfonos

- Número entre 9 y 15 dígitos
- Solo números permitidos
- Tipos: "Mobile", "Home", "Work", "Other"

## Respuestas de Error

### Validación Fallida (400)

```json
{
  "status": "error",
  "errorMessage": "Validation failed",
  "errors": {
    "firstName": "El nombre es requerido",
    "email": "El email debe ser válido"
  }
}
```

### Recurso No Encontrado (404)

```json
{
  "status": "error",
  "errorMessage": "Persona no encontrada"
}
```

## Características Técnicas

- **Soft Delete**: Las personas eliminadas se marcan con `deletedAt` en lugar de eliminarse físicamente
- **Búsqueda Case-Insensitive**: La búsqueda no distingue entre mayúsculas y minúsculas
- **Paginación**: Implementada en el endpoint de listado
- **Transacciones**: Las operaciones de eliminación usan transacciones para mantener consistencia
- **Validación de Unicidad**: El email debe ser único en el sistema
- **Gestión de Relaciones**: Asignación/desasignación de personas a propiedades con roles específicos

## Headers Requeridos

- `Authorization: Bearer <token>` - Para todos los endpoints
- `Content-Type: application/json` - Para POST/PATCH
