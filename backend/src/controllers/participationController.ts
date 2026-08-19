import { Request, Response } from "express";
import { z } from "zod";
import { Participation } from "../models/Participation.js";
import { Campaign } from "../models/Campaign.js";
import { AppError } from "../utils/AppError.js";
import { track, AnalyticsEvent } from "../config/analytics.js";
import { Notification } from "../models/Notification.js";

export async function joinCampaign(req: Request, res: Response): Promise<void> {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (campaign.status !== "active") throw new AppError("Campaign is not open for joining", 400);

  const count = await Participation.countDocuments({ campaign: campaign._id });
  if (count >= campaign.maxParticipants) throw new AppError("Campaign has reached its participant limit", 400);

  try {
    const participation = await Participation.create({
      campaign: campaign._id,
      participant: req.auth!.sub,
    });
    track(req.auth!.sub, AnalyticsEvent.CAMPAIGN_JOINED, { campaignId: campaign._id.toString() });
    res.status(201).json({ success: true, data: participation });
  } catch (err: unknown) {
    // Duplicate key error from the unique (campaign, participant) index.
    if ((err as { code?: number }).code === 11000) {
      throw new AppError("You have already joined this campaign", 409);
    }
    throw err;
  }
}

export const submitProofSchema = z.object({
  body: z.object({
    mediaUrls: z.array(z.string().url()).min(1, "At least one photo/video is required"),
    description: z.string().min(10),
    gps: z.object({ lat: z.number(), lng: z.number() }).optional(),
    contentHash: z.string().min(1),
  }),
});

export async function submitProof(req: Request, res: Response): Promise<void> {
  const participation = await Participation.findOne({
    campaign: req.params.campaignId,
    participant: req.auth!.sub,
  });
  if (!participation) throw new AppError("You have not joined this campaign", 404);
  if (participation.status !== "joined") throw new AppError("Proof has already been submitted", 400);

  participation.status = "proof_submitted";
  participation.proof = { ...req.body, submittedAt: new Date() };
  await participation.save();

  track(req.auth!.sub, AnalyticsEvent.PROOF_UPLOADED, { campaignId: req.params.campaignId });
  res.json({ success: true, data: participation });
}

export const verifySchema = z.object({
  body: z.object({
    approved: z.boolean(),
    comment: z.string().max(1000).optional(),
    signature: z.string().optional(), // supervisor's on-chain tx hash / signed payload
  }),
});

export async function verifyParticipation(req: Request, res: Response): Promise<void> {
  const participation = await Participation.findById(req.params.id).populate("campaign");
  if (!participation) throw new AppError("Participation not found", 404);
  if (participation.status !== "proof_submitted") {
    throw new AppError("This submission is not pending verification", 400);
  }

  const { approved, comment, signature } = req.body;
  participation.status = approved ? "verified" : "rejected";
  participation.verification = {
    supervisor: req.auth!.sub as unknown as never,
    comment: comment ?? "",
    signature: signature ?? null,
    verifiedAt: new Date(),
  };
  if (approved) {
    const campaign = participation.campaign as unknown as { rewardPerParticipant: number };
    participation.reward.amount = campaign.rewardPerParticipant;
  }
  await participation.save();

  await Notification.create({
    user: participation.participant,
    type: approved ? "proof_verified" : "proof_rejected",
    title: approved ? "Your contribution was verified! 🎉" : "Your submission needs changes",
    body: comment ?? "",
  });

  track(req.auth!.sub, AnalyticsEvent.VERIFICATION_COMPLETED, { approved });
  res.json({ success: true, data: participation });
}

export async function pendingVerifications(req: Request, res: Response): Promise<void> {
  const items = await Participation.find({ status: "proof_submitted" })
    .populate("campaign", "title organization")
    .populate("participant", "name email walletAddress");
  res.json({ success: true, data: items });
}

export const claimSchema = z.object({
  body: z.object({
    claimTxHash: z.string().min(1, "On-chain claim transaction hash is required"),
  }),
});

// Records the reward claim after the frontend has submitted+confirmed the
// `claim_reward` Soroban transaction via Freighter. The contract itself is
// the source of truth for double-claim prevention; this endpoint mirrors
// that state off-chain for fast dashboard/analytics reads.
export async function recordClaim(req: Request, res: Response): Promise<void> {
  const participation = await Participation.findById(req.params.id);
  if (!participation) throw new AppError("Participation not found", 404);
  if (participation.status !== "verified") throw new AppError("Reward is not yet claimable", 400);
  if (participation.reward.claimTxHash) throw new AppError("Reward already claimed", 409);

  participation.status = "claimed";
  participation.reward.claimTxHash = req.body.claimTxHash;
  participation.reward.claimedAt = new Date();
  await participation.save();

  track(req.auth!.sub, AnalyticsEvent.REWARD_CLAIMED, {
    participationId: participation._id.toString(),
    amount: participation.reward.amount,
  });
  res.json({ success: true, data: participation });
}

export async function myParticipations(req: Request, res: Response): Promise<void> {
  const items = await Participation.find({ participant: req.auth!.sub })
    .populate("campaign", "title category coverImageUrl rewardPerParticipant rewardTokenSymbol");
  res.json({ success: true, data: items });
}
