import mongoose from "mongoose";

declare global {
  var __mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Add it to .env.local (not committed) or your deployment environment.",
  );
}

const cached = global.__mongooseConn ?? { conn: null, promise: null };
global.__mongooseConn = cached;

export default async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
