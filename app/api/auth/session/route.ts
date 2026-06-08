import { NextResponse } from "next/server";
import { publicProfile, setAuthCookies, clearAuthCookies } from "@/lib/authCookies";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Missing login session." }, { status: 400 });
    }

    if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase auth session verification is not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Invalid login session." }, { status: 401 });
    }

    const authUser = data.user;
    const email = authUser.email.trim().toLowerCase();
    const username =
      authUser.user_metadata?.username ||
      authUser.user_metadata?.name ||
      email.split("@")[0];

    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .or(`auth_user_id.eq.${authUser.id},email.eq.${email}`)
      .maybeSingle();

    const profileResult = existing?.id
      ? await supabaseAdmin
          .from("user_profiles")
          .update({
            auth_user_id: authUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("user_profiles")
          .insert({
            auth_user_id: authUser.id,
            email,
            username,
          })
          .select("*")
          .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile loading failed." }, { status: 500 });
    }

    const profile = publicProfile(profileResult.data);
    const response = NextResponse.json({ profile, user: profile });
    setAuthCookies(response, profile);

    return response;
  } catch {
    return NextResponse.json({ error: "Login session could not be created." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
