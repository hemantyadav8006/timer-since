import mongoose, { Model, Schema } from "mongoose";

export type TimerDoc = {
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  tags: string[];
  mode: "elapsed" | "countdown";
  startDate: number;
  targetDate: number | null;
  archived: boolean;
  favorite: boolean;
  pinned: boolean;
  shareId: string;
  isPublic: boolean;
  userId: string;
  stopped: boolean;
  stoppedAt: number | null;
  streaks: { startTime: number; endTime: number; duration: number }[];
  milestoneConfig: {
    enabled: boolean;
    customMilestones: { label: string; durationMs: number; icon: string }[];
  };
  sound: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const MilestoneDefSchema = new Schema(
  {
    label: { type: String, required: true },
    durationMs: { type: Number, required: true },
    icon: { type: String, default: "🏆" },
  },
  { _id: false },
);

const StreakSchema = new Schema(
  {
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, required: true },
  },
  { _id: false },
);

const CATEGORY_VALUES = [
  "health", "productivity", "relationship", "education",
  "lifestyle", "personal", "work", "custom",
];

const TimerSchema = new Schema<TimerDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    icon: { type: String, default: "⏱️", maxlength: 8 },
    color: { type: String, default: "#00FF88", maxlength: 9 },
    category: { type: String, enum: CATEGORY_VALUES, default: "personal" },
    tags: { type: [String], default: [] },
    mode: { type: String, enum: ["elapsed", "countdown"], default: "elapsed" },
    startDate: { type: Number, required: true },
    targetDate: { type: Number, default: null },
    archived: { type: Boolean, default: false, index: true },
    favorite: { type: Boolean, default: false, index: true },
    pinned: { type: Boolean, default: false, index: true },
    shareId: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    userId: { type: String, default: "", index: true },
    stopped: { type: Boolean, default: false },
    stoppedAt: { type: Number, default: null },
    streaks: { type: [StreakSchema], default: [] },
    milestoneConfig: {
      type: {
        enabled: { type: Boolean, default: true },
        customMilestones: { type: [MilestoneDefSchema], default: [] },
      },
      default: { enabled: true, customMilestones: [] },
    },
    sound: {
      type: String,
      enum: ["heartbeat", "rain", "bowls", "nature", "chime", "none"],
      default: "none",
    },
  },
  { timestamps: true },
);

TimerSchema.index({ userId: 1, archived: 1, createdAt: -1 });
TimerSchema.index({ userId: 1, pinned: -1, favorite: -1, createdAt: -1 });
TimerSchema.index({ tags: 1 });

export const Timer: Model<TimerDoc> =
  (mongoose.models.Timer as Model<TimerDoc>) ||
  mongoose.model<TimerDoc>("Timer", TimerSchema);
