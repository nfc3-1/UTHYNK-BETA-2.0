import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safeRedirect";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabaseConfig";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "google";
  const nextPath = safeInternalPath(url.searchParams.get("next"));

  if (provider !== "google") {
    return NextResponse.json({ error: "Unsupported OAuth provider." }, { status: 400 });
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.json(
      { error: "Supabase Auth is not configured for this deployment." },
      { status: 503 }
    );
  }

  const authClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const redirectTo = `${url.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: error?.message || "Google login failed." }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}
