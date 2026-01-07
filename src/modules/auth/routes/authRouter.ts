import express from "express";
import { AuthController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import {
  validateLogin,
  validateRegister,
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserRoles,
  validateUserQuery,
  validateUserParams,
  validateUserSearch,
} from "../validators";
import { authenticationToken, requireDirectorRole } from "@core/middlewares";

const authRouter = express.Router();
const authController = bindAllMethods(new AuthController());

// Rutas públicas
authRouter.post("/register", validateRegister, authController.register);
authRouter.post("/login", validateLogin, authController.login);

// Rutas protegidas - CRUD de usuarios (solo para directores)
authRouter.post(
  "/users",
  authenticationToken,
  requireDirectorRole,
  validateCreateUser,
  authController.createUser
);
authRouter.get(
  "/users",
  authenticationToken,
  requireDirectorRole,
  validateUserQuery,
  authController.getUsers
);
authRouter.get(
  "/users/search",
  authenticationToken,
  requireDirectorRole,
  validateUserSearch,
  authController.searchUsers
);
authRouter.get(
  "/users/:id",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  authController.getUserById
);
authRouter.put(
  "/users/:id",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUser,
  authController.updateUser
);
authRouter.patch(
  "/users/:id",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUser,
  authController.updateUser
);
authRouter.delete(
  "/users/:id",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  authController.deleteUser
);
authRouter.put(
  "/users/:id/roles",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUserRoles,
  authController.updateUserRoles
);
authRouter.get(
  "/roles",
  authenticationToken,
  requireDirectorRole,
  authController.getAllRoles
);

export { authRouter };
