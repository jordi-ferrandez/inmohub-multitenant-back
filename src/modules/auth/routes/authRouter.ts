        import express from "express";
import { AuthController } from "../controllers";
import { bindAllMethods } from "@core/utils";
import {
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserRoles,
  validateUserQuery,
  validateUserParams,
  validateUserSearch,
  validateUpdateUserPassword,
} from "../validators";
import { authenticationToken, requireDirectorRole } from "@core/middlewares";

const authRouter = express.Router();
const authController = bindAllMethods(new AuthController());

// Rutas públicas
authRouter.post("/register", validateRegister, authController.register);
authRouter.post("/login", validateLogin, authController.login);
authRouter.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
authRouter.post("/reset-password", validateResetPassword, authController.resetPassword);
authRouter.get("/verify-email", authController.verifyEmail);

// Rutas protegidas
authRouter.get("/me", authenticationToken, authController.getMe);
authRouter.put("/me", authenticationToken, validateUpdateProfile, authController.updateMe);
authRouter.post(
  "/change-password",
  authenticationToken,
  validateChangePassword,
  authController.changePassword
);
authRouter.patch(
  "/onboarding",
  authenticationToken,
  authController.completeOnboarding
);

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
authRouter.post(
  "/users/:id/reset-onboarding",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  authController.resetOnboarding
);
authRouter.post(
  "/users/:id/password",
  authenticationToken,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUserPassword,
  authController.updateUserPassword
);
authRouter.get(
  "/roles",
  authenticationToken,
  requireDirectorRole,
  authController.getAllRoles
);

export { authRouter };
