import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AuthCode, type AuthCodePurpose } from "@/models/AuthCode";

export const CODE_EXPIRY_MS = 15 * 60 * 1000;
export const MAX_VERIFY_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 3;

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(
  code: string,
  codeHash: string,
): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function canResendCode(
  email: string,
  purpose: AuthCodePurpose,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const existing = await AuthCode.findOne({
    email: normalizeEmail(email),
    purpose,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!existing?.createdAt) return { allowed: true };

  const elapsed = Date.now() - new Date(existing.createdAt).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await AuthCode.countDocuments({
    email: normalizeEmail(email),
    purpose,
    createdAt: { $gte: hourAgo },
  });

  if (recentCount >= MAX_SENDS_PER_HOUR) {
    return { allowed: false, retryAfterSeconds: 3600 };
  }

  return { allowed: true };
}

export async function createAndStoreCode(
  email: string,
  purpose: AuthCodePurpose,
): Promise<string> {
  const normalized = normalizeEmail(email);
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  await AuthCode.deleteMany({ email: normalized, purpose });

  await AuthCode.create({
    email: normalized,
    purpose,
    codeHash,
    attempts: 0,
    expiresAt,
  });

  return code;
}

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; error: string; attemptsLeft?: number };

export async function verifyStoredCode(
  email: string,
  purpose: AuthCodePurpose,
  code: string,
): Promise<VerifyCodeResult> {
  const normalized = normalizeEmail(email);
  const record = await AuthCode.findOne({
    email: normalized,
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return { ok: false, error: "Code expired or invalid. Request a new one." };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await AuthCode.deleteOne({ _id: record._id });
    return {
      ok: false,
      error: "Too many failed attempts. Request a new code.",
    };
  }

  const valid = await verifyOtp(code.trim(), record.codeHash);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    if (attemptsLeft <= 0) {
      await AuthCode.deleteOne({ _id: record._id });
      return {
        ok: false,
        error: "Too many failed attempts. Request a new code.",
      };
    }
    return {
      ok: false,
      error: "Invalid code.",
      attemptsLeft,
    };
  }

  await AuthCode.deleteOne({ _id: record._id });
  return { ok: true };
}

export async function invalidateCodes(
  email: string,
  purpose: AuthCodePurpose,
): Promise<void> {
  await AuthCode.deleteMany({
    email: normalizeEmail(email),
    purpose,
  });
}
