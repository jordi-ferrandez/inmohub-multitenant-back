import { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => {
      const path =
        e.path.length > 0 ? `'${e.path.join(".")}'` : "datos proporcionados";

      let message = e.message;

      // Mensajes más amigables para errores comunes
      if (e.code === "invalid_type") {
        message = `Debe ser ${e.expected}, se recibió ${e.received}`;
      } else if (e.code === "too_small") {
        message = `Mínimo ${e.minimum} caracteres`;
      }

      return `• Campo ${path}: ${message}`;
    })
    .join("\n");
}
