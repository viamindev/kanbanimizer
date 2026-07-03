import { Router } from "express";
import { register, login, logout, refresh } from "./auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);

export default router;