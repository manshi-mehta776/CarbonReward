import { Router } from "express";
import { register, login, me, connectWallet, registerSchema, loginSchema, connectWalletSchema } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.get("/me", requireAuth, me);
router.post("/wallet", requireAuth, validate(connectWalletSchema), connectWallet);

export default router;
