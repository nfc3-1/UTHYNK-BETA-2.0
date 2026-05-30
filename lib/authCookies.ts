import { NextResponse } from "next/server";

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

export function setAuthCookies(response: NextResponse, profile: UthynkCookieProfile) {
  const safeProfile = publicProfile(profile);

  response.cookies.set(PROFILE_COOKIE, JSON.stringify(safeProfile), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set(
    SESSION_COOKIE,
    JSON.stringify({
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
