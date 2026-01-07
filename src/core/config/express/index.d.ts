import "express";

// TODO - Definir una interfaz más específica para el usuario

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      user?: any; // Puedes definir un tipo más específico si lo deseas
      queryValidated?: any;
      paramsValidated?: any;
      bodyValidated?: any;
    }
  }
}
