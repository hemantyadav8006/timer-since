import mongoose, { Model, Schema } from "mongoose";

export type AuthCodePurpose = "email_verification" | "password_reset";

export type AuthCodeDoc = {
  email: string;
  purpose: AuthCodePurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

const AuthCodeSchema = new Schema<AuthCodeDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      required: true,
      enum: ["email_verification", "password_reset"],
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

AuthCodeSchema.index({ email: 1, purpose: 1 });
AuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthCode: Model<AuthCodeDoc> =
  (mongoose.models.AuthCode as Model<AuthCodeDoc>) ||
  mongoose.model<AuthCodeDoc>("AuthCode", AuthCodeSchema);
