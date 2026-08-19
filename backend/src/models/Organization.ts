import { Schema, model, Types, InferSchemaType } from "mongoose";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["school", "university", "csr", "municipality", "ngo", "government"],
      required: true,
    },
    owner: { type: Types.ObjectId, ref: "User", required: true },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    approved: { type: Boolean, default: false },
    approvedBy: { type: Types.ObjectId, ref: "User", default: null },
    approvedSupervisors: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema> & { _id: Types.ObjectId };
export const Organization = model("Organization", organizationSchema);
