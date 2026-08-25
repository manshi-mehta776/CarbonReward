import { Request, Response } from "express";
import { z } from "zod";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(140),
    type: z.enum(["school", "university", "csr", "municipality", "ngo", "government"]),
    description: z.string().optional(),
    website: z.string().url().optional(),
  }),
});

export async function createOrganization(req: Request, res: Response): Promise<void> {
  const org = await Organization.create({ ...req.body, owner: req.auth!.sub, approved: false });
  res.status(201).json({ success: true, data: org });
}

export async function myOrganizations(req: Request, res: Response): Promise<void> {
  const orgs = await Organization.find({ owner: req.auth!.sub });
  res.json({ success: true, data: orgs });
}

export const addSupervisorSchema = z.object({
  body: z.object({ userId: z.string() }),
});

export async function addSupervisor(req: Request, res: Response): Promise<void> {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError("Organization not found", 404);
  if (!org.owner || org.owner.toString() !== req.auth!.sub) throw new AppError("Not authorized", 403);

  const user = await User.findById(req.body.userId);
  if (!user || user.role !== "supervisor") throw new AppError("Target user must have the supervisor role", 400);

  if (!org.approvedSupervisors.map((s) => s.toString()).includes(user._id.toString())) {
    org.approvedSupervisors.push(user._id);
    await org.save();
  }
  res.json({ success: true, data: org });
}

export async function orgAnalytics(req: Request, res: Response): Promise<void> {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError("Organization not found", 404);
  if (!org.owner || org.owner.toString() !== req.auth!.sub) throw new AppError("Not authorized", 403);

  const { Campaign } = await import("../models/Campaign.js");
  const { Participation } = await import("../models/Participation.js");

  const campaigns = await Campaign.find({ organization: org._id });
  const campaignIds = campaigns.map((c) => c._id);
  const participations = await Participation.find({ campaign: { $in: campaignIds } });

  res.json({
    success: true,
    data: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalParticipants: participations.length,
      verifiedContributions: participations.filter((p) => p.status === "verified" || p.status === "claimed").length,
      rewardsDistributed: participations
        .filter((p) => p.status === "claimed")
        .reduce((sum, p) => sum + (p.reward?.amount ?? 0), 0),
    },
  });
}
