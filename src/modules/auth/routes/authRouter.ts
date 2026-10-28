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
import { authenticationToken, requireDirectorRole, tenantMiddleware } from "@core/middlewares";

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
  tenantMiddleware,
  requireDirectorRole,
  validateCreateUser,
  authController.createUser
);
authRouter.get(
  "/users",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserQuery,
  authController.getUsers
);
authRouter.get(
  "/users/search",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserSearch,
  authController.searchUsers
);
authRouter.get(
  "/users/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  authController.getUserById
);
authRouter.put(
  "/users/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUser,
  authController.updateUser
);
authRouter.patch(
  "/users/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUser,
  authController.updateUser
);
authRouter.delete(
  "/users/:id",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  authController.deleteUser
);
authRouter.put(
  "/users/:id/roles",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUserRoles,
  authController.updateUserRoles
);
authRouter.post(
  "/users/:id/reset-onboarding",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  authController.resetOnboarding
);
authRouter.post(
  "/users/:id/password",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  validateUpdateUserPassword,
  authController.updateUserPassword
);
authRouter.post(
  "/users/:id/send-reset-link",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  validateUserParams,
  authController.sendResetPasswordLink
);
authRouter.get(
  "/roles",
  authenticationToken,
  tenantMiddleware,
  requireDirectorRole,
  authController.getAllRoles
);

export { authRouter };
