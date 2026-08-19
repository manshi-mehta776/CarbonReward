import { Router } from "express";
import { submitFeedback, createFeedbackSchema } from "../controllers/feedbackController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.post("/", requireAuth, validate(createFeedbackSchema), submitFeedback);

export default router;
