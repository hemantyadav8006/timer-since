const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.WEBSITE_ENV === "prod") {
  throw new Error("JWT_SECRET must be set in production.");
}

const SECRET = JWT_SECRET ?? "timer-dev-only-secret-not-for-production";

export const AUTH_COOKIE_NAME = "timer_session";

export type JwtPayload = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64url(String.fromCharCode(...new Uint8Array(signature)));
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  return expected === signature;
}

export async function createToken(
  userId: string,
  email: string,
): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      userId,
      email,
      iat: now,
      exp: now + 30 * 24 * 60 * 60,
    }),
  );
  const signature = await hmacSign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const valid = await hmacVerify(`${header}.${payload}`, signature);
    if (!valid) return null;

    const decoded = JSON.parse(base64urlDecode(payload)) as JwtPayload;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function getUserIdFromToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}
