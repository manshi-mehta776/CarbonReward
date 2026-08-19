import { Request, Response } from "express";
import { User } from "../models/User.js";

export async function leaderboard(_req: Request, res: Response): Promise<void> {
  const top = await User.find({ role: "participant" })
    .select("name avatarUrl totalRewardsEarned totalContributions")
    .sort({ totalContributions: -1, totalRewardsEarned: -1 })
    .limit(50);
  res.json({ success: true, data: top });
}
