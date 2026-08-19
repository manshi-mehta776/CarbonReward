import { Router } from "express";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  closeCampaign,
  createCampaignSchema,
} from "../controllers/campaignController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  joinCampaign,
  submitProof,
  submitProofSchema,
  myParticipations,
} from "../controllers/participationController.js";

const router = Router();

router.get("/", listCampaigns);
router.get("/:id", getCampaign);
router.post("/", requireAuth, requireRole("organization"), validate(createCampaignSchema), createCampaign);
router.post("/:id/close", requireAuth, requireRole("organization"), closeCampaign);

router.post("/:campaignId/join", requireAuth, requireRole("participant"), joinCampaign);
router.post(
  "/:campaignId/proof",
  requireAuth,
  requireRole("participant"),
  validate(submitProofSchema),
  submitProof
);

router.get("/me/participations", requireAuth, requireRole("participant"), myParticipations);

export default router;
