import { Request, Response } from "express";
import { z } from "zod";
import { Campaign, CAMPAIGN_CATEGORIES } from "../models/Campaign.js";
import { Organization } from "../models/Organization.js";
import { AppError } from "../utils/AppError.js";
import { track, AnalyticsEvent } from "../config/analytics.js";

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(4).max(140),
    description: z.string().min(20),
    category: z.enum(CAMPAIGN_CATEGORIES),
    organizationId: z.string(),
    rewardPerParticipant: z.number().positive(),
    rewardTokenSymbol: z.string().default("XLM"),
    maxParticipants: z.number().int().positive(),
    startDate: z.string(),
    endDate: z.string(),
    rules: z.string().optional(),
    onChainId: z.number().optional(),
    location: z
      .object({ label: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() })
      .optional(),
  }),
});

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const org = await Organization.findById(req.body.organizationId);
  if (!org) throw new AppError("Organization not found", 404);
  // if (!org.approved) throw new AppError("Organization must be approved by an admin before creating campaigns", 403);
  if (!org.owner || org.owner.toString() !== req.auth!.sub) throw new AppError("Not authorized for this organization", 403);

  const campaign = await Campaign.create({ ...req.body, organization: org._id, status: "active" });
  track(req.auth!.sub, AnalyticsEvent.CAMPAIGN_CREATED, { campaignId: campaign._id.toString() });
  res.status(201).json({ success: true, data: campaign });
}

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const { category, status = "active", search, page = "1", limit = "12" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .populate("organization", "name type logoUrl")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Campaign.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page: pageNum, limit: limitNum } });
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  const campaign = await Campaign.findById(req.params.id).populate("organization");
  if (!campaign) throw new AppError("Campaign not found", 404);
  res.json({ success: true, data: campaign });
}

export async function closeCampaign(req: Request, res: Response): Promise<void> {
  const campaign = await Campaign.findById(req.params.id).populate("organization");
  if (!campaign) throw new AppError("Campaign not found", 404);
  const org = campaign.organization as unknown as { owner: { toString(): string } };
  if (org.owner.toString() !== req.auth!.sub) throw new AppError("Not authorized", 403);

  campaign.status = "closed";
  await campaign.save();
  res.json({ success: true, data: campaign });
}
