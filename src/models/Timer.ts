import mongoose, { Model, Schema } from "mongoose";

export type TimerDoc = {
  startTime: number;
};

const TimerSchema = new Schema<TimerDoc>(
  {
    // Stored as epoch milliseconds for easy cross-device persistence.
    startTime: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Timer: Model<TimerDoc> =
  (mongoose.models.Timer as Model<TimerDoc>) ||
  mongoose.model<TimerDoc>("Timer", TimerSchema);
