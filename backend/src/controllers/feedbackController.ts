import { Request, Response } from "express";
import { z } from "zod";
import { Feedback } from "../models/Feedback.js";
import { track, AnalyticsEvent } from "../config/analytics.js";

export const createFeedbackSchema = z.object({
  body: z.object({
    campaignId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    message: z.string().min(3).max(2000),
    category: z.enum(["general", "bug", "feature_request", "campaign_experience"]).default("general"),
  }),
});

export async function submitFeedback(req: Request, res: Response): Promise<void> {
  const { campaignId, rating, message, category } = req.body;
  const feedback = await Feedback.create({
    user: req.auth!.sub,
    campaign: campaignId ?? null,
    rating,
    message,
    category,
  });
  track(req.auth!.sub, AnalyticsEvent.FEEDBACK_SUBMITTED, { rating, category });
  res.status(201).json({ success: true, data: feedback });
}
