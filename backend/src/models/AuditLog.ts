import { Schema, model, Types, InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    actor: { type: Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true }, // e.g. "campaign.create", "reward.claim"
    targetType: { type: String, default: null },
    targetId: { type: Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };
export const AuditLog = model("AuditLog", auditLogSchema);
