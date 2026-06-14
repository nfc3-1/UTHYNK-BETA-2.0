"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeInternalPath } from "@/lib/safeRedirect";

const STORAGE_KEY = "uthynk-profile";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => safeInternalPath(searchParams.get("next")), [searchParams]);
  const oauthError = searchParams.get("error");
  const forceLogin = searchParams.get("force") === "1";
  const shouldLogout = searchParams.get("logout") === "1";
  const [mode, setMode] = useState<"signup" | "login">(
    searchParams.get("mode") === "login" ? "login" : "signup"
  );
  const [ageBand, setAgeBand] = useState("18_plus");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboardingGoal, setOnboardingGoal] = useState("sharpen_reasoning");
  const [onboardingStyle, setOnboardingStyle] = useState("balanced");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (oauthError) {
      setError("Google sign-in could not be completed. Check the Supabase redirect URL and provider setup.");
    }
  }, [oauthError]);

  useEffect(() => {
    async function checkSession() {
      if (shouldLogout) {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "uthynk-profile=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "uthynk-free-pass-used=; path=/; max-age=0; SameSite=Lax";
        setMode("login");
        return;
      }

      if (forceLogin) {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "uthynk-profile=; path=/; max-age=0; SameSite=Lax";
        setMode("login");
        return;
      }

      const response = await fetch("/api/auth/me");
      const payload = await response.json().catch(() => ({}));

      if (payload.authenticated) {
        router.replace(nextPath);
      }
    }

    checkSession();
  }, [forceLogin, nextPath, router, shouldLogout]);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        body: JSON.stringify({
          ageBand,
          email,
          onboardingGoal,
          onboardingStyle,
          password,
          username,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Authentication failed.");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.profile));
      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authCard card">
        <div className="authBrandLockup">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="authBrandLogo" />
          <div>
            <strong>UThynk</strong>
            <span>Better thinking. <em>Better decisions.</em></span>
          </div>
        </div>

        <div className="authModeSwitch" aria-label="Authentication mode">
          <button
            className={mode === "signup" ? "active" : ""}
            type="button"
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
        </div>

        <div className="panelLabel">
          {mode === "signup" ? "Beta onboarding" : "Welcome back"}
        </div>
        <h1>{mode === "signup" ? "Start your profile" : "Continue your profile"}</h1>
        <p>
          {mode === "signup"
            ? "Create a UThynk account so your reasoning streak, traits, and sessions persist across devices."
            : "Sign in to restore your memory, streak, traits, and session continuity."}
        </p>

        <div className="authForm">
          <a
            className="btn googleAuthButton"
            href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(nextPath)}`}
          >
            Continue with Google
          </a>

          <div className="authDivider"><span>or</span></div>

          {mode === "signup" ? (
            <label>
              <span>Name</span>
              <input
                autoComplete="name"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="What should UThynk call you?"
                type="text"
                value={username}
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {mode === "signup" ? (
            <>
              <label>
                <span>Age range</span>
                <select value={ageBand} onChange={(event) => setAgeBand(event.target.value)}>
                  <option value="under_13">Under 13</option>
                  <option value="13_17">13-17</option>
                  <option value="18_plus">18+</option>
                </select>
              </label>

              <label>
                <span>Primary goal</span>
                <select
                  value={onboardingGoal}
                  onChange={(event) => setOnboardingGoal(event.target.value)}
                >
                  <option value="sharpen_reasoning">Sharpen reasoning</option>
                  <option value="debate_better">Debate better</option>
                  <option value="make_better_decisions">Make better decisions</option>
                  <option value="spot_manipulation">Spot manipulation</option>
                  <option value="build_confidence">Build confidence</option>
                </select>
              </label>

              <label>
                <span>Coaching style</span>
                <select
                  value={onboardingStyle}
                  onChange={(event) => setOnboardingStyle(event.target.value)}
                >
                  <option value="balanced">Balanced</option>
                  <option value="direct">Direct</option>
                  <option value="supportive">Supportive</option>
                  <option value="challenging">Challenging</option>
                </select>
              </label>
            </>
          ) : null}

          {error ? <p className="authError">{error}</p> : null}

          <button
            className="btn btnPrimary"
            disabled={!email || !password || loading}
            type="button"
            onClick={handleSubmit}
          >
            {loading ? "Checking..." : mode === "signup" ? "Start UThynk" : "Sign in"}
          </button>
        </div>

        <p className="authFinePrint">
          New users can try 3 reasoning challenges before creating a profile.
        </p>
      </section>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="authShell">
          <section className="authCard card">
            <div className="authBrandLockup">
              <img src="/brand/uthynk-wing-mark.svg" alt="" className="authBrandLogo" />
              <div>
                <strong>UThynk</strong>
                <span>Better thinking. <em>Better decisions.</em></span>
              </div>
            </div>
            <div className="panelLabel">UThynk Access</div>
            <h1>Start your profile</h1>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
