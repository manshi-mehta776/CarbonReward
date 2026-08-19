import { Schema, model, Types, InferSchemaType } from "mongoose";

const participationSchema = new Schema(
  {
    campaign: { type: Types.ObjectId, ref: "Campaign", required: true },
    participant: { type: Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["joined", "proof_submitted", "verified", "rejected", "claimed"],
      default: "joined",
    },
    proof: {
      mediaUrls: [{ type: String }],
      description: { type: String, default: "" },
      gps: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      contentHash: { type: String, default: null }, // hash submitted to the contract
      submittedAt: { type: Date, default: null },
    },
    verification: {
      supervisor: { type: Types.ObjectId, ref: "User", default: null },
      comment: { type: String, default: "" },
      signature: { type: String, default: null }, // supervisor's signed tx hash
      verifiedAt: { type: Date, default: null },
    },
    reward: {
      amount: { type: Number, default: 0 },
      claimTxHash: { type: String, default: null },
      claimedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// A participant may only join a given campaign once — enforced both here
// and on-chain for defense in depth.
participationSchema.index({ campaign: 1, participant: 1 }, { unique: true });
participationSchema.index({ status: 1 });

export type ParticipationDoc = InferSchemaType<typeof participationSchema> & { _id: Types.ObjectId };
export const Participation = model("Participation", participationSchema);
