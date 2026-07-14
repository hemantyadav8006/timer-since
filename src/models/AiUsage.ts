import mongoose, { Model, Schema } from "mongoose";

export type AiUsageDoc = {
  userId: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string | null;
  cached?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const AiUsageSchema = new Schema<AiUsageDoc>(
  {
    userId: { type: String, required: true, index: true },
    feature: { type: String, required: true, index: true },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    success: { type: Boolean, required: true },
    errorCode: { type: String, default: null },
    cached: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AiUsageSchema.index({ userId: 1, feature: 1, createdAt: -1 });

export const AiUsage: Model<AiUsageDoc> =
  mongoose.models.AiUsage ||
  mongoose.model<AiUsageDoc>("AiUsage", AiUsageSchema);
