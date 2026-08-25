import { Router } from "express";
import {
  verifyParticipation,
  verifySchema,
  pendingVerifications,
  recordClaim,
  claimSchema,
} from "../controllers/participationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/pending", requireAuth, requireRole("supervisor", "organization"), pendingVerifications);
router.post("/:id/verify", requireAuth, requireRole("supervisor", "organization"), validate(verifySchema), verifyParticipation);
router.post("/:id/claim", requireAuth, requireRole("participant"), validate(claimSchema), recordClaim);

export default router;
