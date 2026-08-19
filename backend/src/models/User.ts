import { Schema, model, Types, InferSchemaType } from "mongoose";

export const ROLES = ["participant", "supervisor", "organization", "sponsor", "admin"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "participant" },
    walletAddress: { type: String, default: null, index: true },
    walletVerifiedAt: { type: Date, default: null },
    organization: { type: Types.ObjectId, ref: "Organization", default: null },
    approved: { type: Boolean, default: function (this: { role: Role }) {
      // participants/sponsors are auto-approved; org & supervisor need admin sign-off
      return this.role === "participant" || this.role === "sponsor";
    } },
    avatarUrl: { type: String, default: null },
    bio: { type: String, default: "" },
    totalRewardsEarned: { type: Number, default: 0 },
    totalContributions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, approved: 1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User = model("User", userSchema);
