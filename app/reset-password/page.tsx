'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabaseConfig';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authClient = useMemo(
    () =>
      createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: true,
        },
      }),
    []
  );

  useEffect(() => {
    async function prepareRecoverySession() {
      try {
        const code = searchParams.get('code');
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error: exchangeError } = await authClient.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await authClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
        }

        setReady(true);
      } catch {
        setError('This reset link could not be verified. Request a new reset link and try again.');
      }
    }

    prepareRecoverySession();
  }, [authClient, searchParams]);

  async function updatePassword() {
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await authClient.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated. You can sign in now.');
      window.setTimeout(() => router.replace('/login?mode=login'), 900);
    } catch {
      setError('Password could not be updated. Request a new reset link and try again.');
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

        <div className="panelLabel">Account recovery</div>
        <h1>Reset your password</h1>
        <p>Set a new password, then sign in with your UThynk email account.</p>

        <div className="authForm">
          <label>
            <span>New password</span>
            <input
              autoComplete="new-password"
              disabled={!ready || loading}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              disabled={!ready || loading}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>

          {error ? <p className="authError">{error}</p> : null}
          {message ? <p className="authSuccess">{message}</p> : null}

          <button
            className="btn btnPrimary"
            disabled={!ready || !password || !confirmPassword || loading}
            type="button"
            onClick={updatePassword}
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>

          <Link className="btn" href="/login?mode=login">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="authShell">
          <section className="authCard card">
            <div className="panelLabel">Account recovery</div>
            <h1>Loading reset link</h1>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
