import mongoose from "mongoose";
import { uuid } from "../util/uuid";


export type ScoreDocument = mongoose.Document & {
  _id: string;
  user_id: string;
  score_worth: number;
}

const scoreSchema = new mongoose.Schema<ScoreDocument>(
  {
    _id: { type: String },
    user_id: { type: String },
    score_worth: { type: Number, index: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

scoreSchema.pre("save", function save(next) {
  const score = this as ScoreDocument;
  score._id = uuid();
  next();
});


export const Score = mongoose.model<ScoreDocument>("Score", scoreSchema);