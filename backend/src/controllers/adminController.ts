import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { AppError } from "../utils/AppError.js";
import { Feedback } from "../models/Feedback.js";
import { Campaign } from "../models/Campaign.js";
import { Participation } from "../models/Participation.js";

export async function approveOrganization(req: Request, res: Response): Promise<void> {
  const org = await Organization.findByIdAndUpdate(
    req.params.id,
    { approved: true, approvedBy: req.auth!.sub },
    { new: true }
  );
  if (!org) throw new AppError("Organization not found", 404);
  res.json({ success: true, data: org });
}

export async function approveSupervisorUser(req: Request, res: Response): Promise<void> {
  const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: user });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { role, approved } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (approved !== undefined) filter.approved = approved === "true";
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
}

export async function feedbackDashboard(_req: Request, res: Response): Promise<void> {
  const feedback = await Feedback.find().populate("user", "name role").sort({ createdAt: -1 }).limit(200);
  const avgRating =
    feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;
  res.json({ success: true, data: { feedback, avgRating, total: feedback.length } });
}

export async function systemHealth(_req: Request, res: Response): Promise<void> {
  const [users, organizations, campaigns, participations] = await Promise.all([
    User.countDocuments(),
    Organization.countDocuments(),
    Campaign.countDocuments(),
    Participation.countDocuments(),
  ]);
  const claimedCount = await Participation.countDocuments({ status: "claimed" });
  const walletsConnected = await User.countDocuments({ walletAddress: { $ne: null } });

  res.json({
    success: true,
    data: {
      users,
      organizations,
      campaigns,
      participations,
      claimedCount,
      walletsConnected,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
}
