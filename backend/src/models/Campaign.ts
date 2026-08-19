import { Schema, model, Types, InferSchemaType } from "mongoose";

export const CAMPAIGN_CATEGORIES = [
  "tree_plantation",
  "river_cleanup",
  "plastic_collection",
  "waste_segregation",
  "beach_cleanup",
  "recycling_drive",
  "water_conservation",
  "community_gardening",
  "awareness_program",
] as const;

const campaignSchema = new Schema(
  {
    onChainId: { type: Number, default: null, index: true }, // Soroban campaign id, set after deploy
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: CAMPAIGN_CATEGORIES, required: true },
    organization: { type: Types.ObjectId, ref: "Organization", required: true },
    coverImageUrl: { type: String, default: null },
    location: {
      label: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    rewardPerParticipant: { type: Number, required: true, min: 0 },
    rewardTokenSymbol: { type: String, default: "XLM" },
    rewardPoolFunded: { type: Number, default: 0 },
    rewardPoolClaimed: { type: Number, default: 0 },
    maxParticipants: { type: Number, required: true, min: 1 },
    approvedSupervisors: [{ type: Types.ObjectId, ref: "User" }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "closed", "completed"],
      default: "draft",
    },
    rules: { type: String, default: "" },
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, category: 1 });
campaignSchema.index({ title: "text", description: "text" });

export type CampaignDoc = InferSchemaType<typeof campaignSchema> & { _id: Types.ObjectId };
export const Campaign = model("Campaign", campaignSchema);
