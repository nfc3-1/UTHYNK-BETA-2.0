"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function establishCookie(accessToken: string) {
    const response = await fetch("/api/auth/session", {
      body: JSON.stringify({ accessToken }),
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
    setStatus("");
    setLoading(true);

    try {
      if (!hasSupabaseEnv() || !supabase) {
        throw new Error("Supabase login is not configured for this deployment.");
      }

      const credentials = {
        email: email.trim().toLowerCase(),
        password,
      };

      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials);

      if (result.error) {
        throw result.error;
      }

      if (!result.data.session?.access_token) {
        setStatus("Check your email to confirm the account, then sign in.");
        return;
      }

      await establishCookie(result.data.session.access_token);
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
        <div className="panelLabel">UThynk Access</div>
        <h1>Sign in to continue</h1>
        <p>
          UThynk saves reasoning progress, traits, and session continuity to your account.
        </p>

        <div className="authModeSwitch" role="tablist" aria-label="Login mode">
          <button
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create account
          </button>
        </div>

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
            <span>Password</span>
            <input
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="authError">{error}</p> : null}
          {status ? <p className="authStatus">{status}</p> : null}

          <button className="btn btnPrimary" disabled={loading} type="submit">
            {loading ? "Checking..." : mode === "signin" ? "Enter UThynk" : "Create account"}
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
            <div className="panelLabel">UThynk Access</div>
            <h1>Sign in to continue</h1>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
