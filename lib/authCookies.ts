import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "uthynk-session";
const PROFILE_COOKIE = "uthynk-profile";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type UthynkCookieProfile = {
  id: string;
  auth_user_id?: string | null;
  email?: string | null;
  username?: string | null;
  age_band?: string | null;
  onboarding_goal?: string | null;
  onboarding_style?: string | null;
  xp?: number | null;
  streak?: number | null;
  rank?: string | null;
  reasoning_score?: number | null;
  primary_trait?: string | null;
};

export function publicProfile(profile: UthynkCookieProfile) {
  return {
    id: profile.id,
    auth_user_id: profile.auth_user_id ?? null,
    email: profile.email ?? null,
    username: profile.username ?? null,
    age_band: profile.age_band ?? "18_plus",
    onboarding_goal: profile.onboarding_goal ?? "sharpen_reasoning",
    onboarding_style: profile.onboarding_style ?? "balanced",
    xp: profile.xp ?? 0,
    streak: profile.streak ?? 0,
    rank: profile.rank ?? "Observer",
    reasoning_score: profile.reasoning_score ?? 70,
    primary_trait: profile.primary_trait ?? "Analytical",
  };
}

function getCookieSecret() {
  return (
    process.env.AUTH_COOKIE_SECRET ||
    process.env.COOKIE_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "uthynk-production-session-cookie-fallback"
      : "uthynk-local-dev-cookie-secret")
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionCookieValue(sessionUser: Pick<UthynkCookieProfile, "id" | "auth_user_id" | "email" | "username">) {
  const payload = base64UrlEncode(JSON.stringify(sessionUser));
  const secret = getCookieSecret();

  if (!secret) {
    return payload;
  }

  return `${payload}.${signPayload(payload, secret)}`;
}

export function parseSessionCookieValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  const secret = getCookieSecret();

  if (secret && payload && signature) {
    const expected = signPayload(payload, secret);
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return null;
    }

    try {
      return JSON.parse(base64UrlDecode(payload)) as Pick<
        UthynkCookieProfile,
        "id" | "auth_user_id" | "email" | "username"
      >;
    } catch {
      return null;
    }
  }

  if (!secret && process.env.NODE_ENV !== "production") {
    try {
      return JSON.parse(base64UrlDecode(payload || value)) as Pick<
        UthynkCookieProfile,
        "id" | "auth_user_id" | "email" | "username"
      >;
    } catch {
      return null;
    }
  }

  return null;
}

export function setAuthCookies(response: NextResponse, profile: UthynkCookieProfile) {
  const safeProfile = publicProfile(profile);

  response.cookies.set(PROFILE_COOKIE, JSON.stringify(safeProfile), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set(
    SESSION_COOKIE,
    createSessionCookieValue({
      id: safeProfile.id,
      auth_user_id: safeProfile.auth_user_id,
      email: safeProfile.email,
      username: safeProfile.username,
    }),
    {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(PROFILE_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });

  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}
