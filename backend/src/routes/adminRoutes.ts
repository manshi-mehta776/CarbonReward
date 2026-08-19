import { Router } from "express";
import {
  approveOrganization,
  approveSupervisorUser,
  listUsers,
  feedbackDashboard,
  systemHealth,
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/users", listUsers);
router.post("/organizations/:id/approve", approveOrganization);
router.post("/users/:id/approve-supervisor", approveSupervisorUser);
router.get("/feedback", feedbackDashboard);
router.get("/health", systemHealth);

export default router;
