import { Router } from "express";
import * as authController from "./auth.controller";
import * as authMiddleware from "@/middleware/auth.middleware";

const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.requireAuth, authController.logout);
router.post('/refresh', authController.refresh);

export default router;