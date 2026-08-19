import { Schema, model, Types, InferSchemaType } from "mongoose";

const feedbackSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    campaign: { type: Types.ObjectId, ref: "Campaign", default: null },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["general", "bug", "feature_request", "campaign_experience"],
      default: "general",
    },
  },
  { timestamps: true }
);

export type FeedbackDoc = InferSchemaType<typeof feedbackSchema> & { _id: Types.ObjectId };
export const Feedback = model("Feedback", feedbackSchema);
