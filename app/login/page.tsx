"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [ageBand, setAgeBand] = useState("18_plus");
  const [onboardingGoal, setOnboardingGoal] = useState("sharpen_reasoning");
  const [onboardingStyle, setOnboardingStyle] = useState("balanced");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function establishCookie(profile: Record<string, unknown>) {
    const response = await fetch("/api/auth/session", {
      body: JSON.stringify({ profile }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Login cookie could not be created.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profileResponse = await fetch("/api/profile", {
        body: JSON.stringify({
          ageBand,
          email,
          onboardingGoal,
          onboardingStyle,
          username,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = await profileResponse.json().catch(() => ({}));

      if (!profileResponse.ok || !payload.profile) {
        throw new Error(payload.error || "Profile could not be created.");
      }

      localStorage.setItem("uthynk-profile", JSON.stringify(payload.profile));
      await establishCookie(payload.profile);
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
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
        <div className="panelLabel">UThynk Access</div>
        <h1>Start your profile</h1>
        <p>
          Create or restore a UThynk profile so your reasoning streak, traits, and sessions persist across devices.
        </p>

        <form className="authForm" onSubmit={handleSubmit}>
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
            <span>Name</span>
            <input
              autoComplete="name"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="What should UThynk call you?"
              type="text"
              value={username}
            />
          </label>

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
            <select value={onboardingGoal} onChange={(event) => setOnboardingGoal(event.target.value)}>
              <option value="sharpen_reasoning">Sharpen reasoning</option>
              <option value="debate_better">Debate better</option>
              <option value="make_better_decisions">Make better decisions</option>
              <option value="spot_manipulation">Spot manipulation</option>
              <option value="build_confidence">Build confidence</option>
            </select>
          </label>

          <label>
            <span>Coaching style</span>
            <select value={onboardingStyle} onChange={(event) => setOnboardingStyle(event.target.value)}>
              <option value="balanced">Balanced</option>
              <option value="direct">Direct</option>
              <option value="supportive">Supportive</option>
              <option value="challenging">Challenging</option>
            </select>
          </label>

          {error ? <p className="authError">{error}</p> : null}

          <button className="btn btnPrimary" disabled={loading} type="submit">
            {loading ? "Setting up..." : "Continue to UThynk"}
          </button>
        </form>
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
