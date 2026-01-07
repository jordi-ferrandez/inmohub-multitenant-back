# Reglas de Respuestas de la API - Backend

## Obligatorio: Uso de Funciones de Respuesta Estandarizadas

**TODA respuesta de endpoint debe usar una de las tres funciones de respuesta estandarizadas:**

- `successResponse` - Para respuestas exitosas simples
- `paginatedResponse` - Para respuestas exitosas con paginación
- `errorResponse` - Para respuestas de error

## Ubicación de las Funciones

Estas funciones están definidas en:

```typescript
import { successResponse, paginatedResponse, errorResponse } from "@core/utils";
```

## Estructuras de Respuesta

### 1. SuccessResponse

**Uso:** Para respuestas exitosas sin paginación.

**Estructura:**

```typescript
{
  status: "success",
  data: T
}
```

**Función:**

```typescript
successResponse<T>(res: Response, data: T, statusCode: number = 200)
```

**Ejemplo:**

```typescript
const user = await userService.getUserById(id);
return successResponse(res, user, 200);
```

**Código HTTP común:**

- `200` - OK (obtención exitosa)
- `201` - Created (creación exitosa)
- `204` - No Content (eliminación exitosa, sin datos)

---

### 2. PaginatedResponse

**Uso:** Para respuestas exitosas que incluyen paginación.

**Estructura:**

```typescript
{
  status: "success",
  data: T,
  metadata: {
    totalItems: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**Función:**

```typescript
paginatedResponse<T>(
  res: Response,
  data: T,
  metadata: PaginationMetadata,
  statusCode: number = 200
)
```

**Ejemplo:**

```typescript
const { data, metadata } = await userService.getUsersPaginated(page, limit);
return paginatedResponse(res, data, metadata, 200);
```

---

### 3. ErrorResponse

**Uso:** Para todas las respuestas de error.

**Estructura:**

```typescript
{
  status: "error",
  errorMessage: string,
  details?: any
}
```

**Función:**

```typescript
errorResponse(
  res: Response,
  errorMessage: string,
  statusCode: number = 400,
  details?: any
)
```

**Ejemplo:**

```typescript
if (!user) {
  return errorResponse(res, "Usuario no encontrado", 404);
}

// Con detalles adicionales (ej: errores de validación)
return errorResponse(res, "Datos inválidos", 400, validationErrors);
```

**Códigos HTTP común:**

- `400` - Bad Request (error de validación, solicitud incorrecta)
- `401` - Unauthorized (sin autenticación)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error (error del servidor)

---

## Ejemplos Completos

### Endpoint GET simple

```typescript
async getUser(req: Request, res: Response) {
  try {
    const user = await userService.findById(req.params.id);
    return successResponse(res, user, 200);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}
```

### Endpoint POST

```typescript
async createUser(req: Request, res: Response) {
  try {
    const newUser = await userService.create(req.body);
    return successResponse(res, newUser, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}
```

### Endpoint GET con paginación

```typescript
async getUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await userService.findAllPaginated(page, limit);

    return paginatedResponse(res, result.data, {
      totalItems: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }, 200);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
```

### Endpoint DELETE

```typescript
async deleteUser(req: Request, res: Response) {
  try {
    await userService.delete(req.params.id);
    return successResponse(res, null, 200);
    // O también: successResponse(res, { message: "Usuario eliminado" }, 200);
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
}
```

---

## Tipos TypeScript

Los tipos están definidos en `@core/types/responseTypes.ts`:

```typescript
export type SuccessResponse<T> = {
  status: "success";
  data: T;
};

export type PaginatedResponse<T> = {
  status: "success";
  data: T;
  metadata: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ErrorResponse = {
  status: "error";
  errorMessage: string;
  details?: any;
};
```

---

## ⚠️ IMPORTANTE

1. **NUNCA** devuelvas respuestas con `res.json()` directamente sin usar estas funciones
2. **NUNCA** devuelvas estructuras de respuesta personalizadas
3. **SIEMPRE** usa `successResponse` para éxito, `paginatedResponse` para paginación, y `errorResponse` para errores
4. El frontend depende de estas estructuras para manejar correctamente las respuestas
5. En bloques `try-catch`, siempre usar `errorResponse` en el `catch`
