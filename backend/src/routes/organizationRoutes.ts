import { Router } from "express";
import {
  createOrganization,
  myOrganizations,
  addSupervisor,
  orgAnalytics,
  createOrgSchema,
  addSupervisorSchema,
} from "../controllers/organizationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/", requireAuth, requireRole("organization"), validate(createOrgSchema), createOrganization);
router.get("/me", requireAuth, requireRole("organization"), myOrganizations);
router.post("/:id/supervisors", requireAuth, requireRole("organization"), validate(addSupervisorSchema), addSupervisor);
router.get("/:id/analytics", requireAuth, requireRole("organization"), orgAnalytics);

export default router;
