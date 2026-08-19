import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User, ROLES } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import { track, AnalyticsEvent } from "../config/analytics.js";
import { AuditLog } from "../models/AuditLog.js";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(ROLES).default("participant"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("An account with this email already exists", 409);

  // Orgs and supervisors require admin approval before they can act.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  const token = signToken(user._id.toString(), user.role);
  track(user._id.toString(), AnalyticsEvent.USER_REGISTERED, { role: user.role });
  await AuditLog.create({ actor: user._id, action: "auth.register", targetType: "User", targetId: user._id });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, approved: user.approved },
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const token = signToken(user._id.toString(), user.role);
  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, approved: user.approved },
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: user });
}

export const connectWalletSchema = z.object({
  body: z.object({
    walletAddress: z.string().min(56).max(56, "Invalid Stellar public key length"),
  }),
});

export async function connectWallet(req: Request, res: Response): Promise<void> {
  const { walletAddress } = req.body;

  // Prevent one wallet from being attached to multiple accounts (sybil guard).
  const inUse = await User.findOne({ walletAddress, _id: { $ne: req.auth!.sub } });
  if (inUse) throw new AppError("This wallet is already linked to another account", 409);

  const user = await User.findByIdAndUpdate(
    req.auth!.sub,
    { walletAddress, walletVerifiedAt: new Date() },
    { new: true }
  );
  track(req.auth!.sub, AnalyticsEvent.WALLET_CONNECTED, { walletAddress });
  res.json({ success: true, data: user });
}
