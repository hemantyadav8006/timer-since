import mongoose, { Model, Schema } from "mongoose";

export type UserDoc = {
  email: string;
  passwordHash: string;
  name: string;
  preferences: {
    theme: string;
    language: string;
    reducedMotion: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    preferences: {
      type: {
        theme: {
          type: String,
          enum: ["emerald", "rose", "ocean", "purple", "amber", "monochrome"],
          default: "emerald",
        },
        language: { type: String, default: "en" },
        reducedMotion: { type: Boolean, default: false },
      },
      default: { theme: "emerald", language: "en", reducedMotion: false },
    },
  },
  { timestamps: true },
);

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
