import { Router } from "express";
import { register, login, test } from "./auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/test', requireAuth, test)

export default router;