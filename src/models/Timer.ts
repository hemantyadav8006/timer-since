import mongoose, { Model, Schema } from "mongoose";

export type TimerDoc = {
  startTime: number;
  stopTimeAt?: number | null;
  resumedTimeAt?: number | null;
};

const TimerSchema = new Schema<TimerDoc>(
  {
    // Stored as epoch milliseconds for easy cross-device persistence.
    startTime: { type: Number, required: true },
    stopTimeAt: { type: Number, default: null },
    resumedTimeAt: { type: Number, default: null },
  },
  { timestamps: true },
);

// Re-register on hot reload so new schema fields are picked up in dev.
if (mongoose.models.Timer) {
  delete mongoose.models.Timer;
}

export const Timer: Model<TimerDoc> = mongoose.model<TimerDoc>(
  "Timer",
  TimerSchema,
);
