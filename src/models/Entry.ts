import mongoose, { Model, Schema } from "mongoose";

export type EntryDoc = {
  timerId: string;
  when: number;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const EntrySchema = new Schema<EntryDoc>(
  {
    timerId: { type: String, index: true, default: "" },
    when: { type: Number, required: true },
    text: { type: String, required: true, trim: true, maxlength: 280 },
  },
  { timestamps: true },
);

export const Entry: Model<EntryDoc> =
  (mongoose.models.Entry as Model<EntryDoc>) ||
  mongoose.model<EntryDoc>("Entry", EntrySchema);
