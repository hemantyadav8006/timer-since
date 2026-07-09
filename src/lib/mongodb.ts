import mongoose from "mongoose";
import { migrateExistingUsersVerified } from "@/lib/migrations/verify-existing-users";

declare global {
  var __mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const isProd = process.env.WEBSITE_ENV === "prod";

const mongoUri = isProd
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_DEV;

const MONGODB_DB_NAME = isProd
  ? process.env.MONGODB_DB_NAME
  : process.env.MONGODB_DB_NAME_DEV;

if (!mongoUri) {
  throw new Error(
    isProd
      ? "Missing MONGODB_URI. Add it to your deployment environment."
      : "Missing MONGODB_URI_DEV. Add it to .env.local (not committed).",
  );
}

const MONGODB_URI = mongoUri;

const cached = global.__mongooseConn ?? { conn: null, promise: null };
global.__mongooseConn = cached;

export default async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME || undefined,
        bufferCommands: false,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    await migrateExistingUsersVerified();
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}
