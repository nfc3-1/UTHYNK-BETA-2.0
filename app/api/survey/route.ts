import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { hasSupabaseAdminEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

const SURVEY_EVENTS = [
  "soft_launch_survey_prompted",
  "soft_launch_survey_dismissed",
  "soft_launch_survey_completed",
];

export async function GET() {
  const sessionUser = await getServerSessionUser();

  if (!sessionUser?.id) {
    return NextResponse.json({ eligible: true, source: "guest" });
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json({ eligible: true, source: "local" });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback_submissions")
    .select("id, event_type, created_at")
    .eq("profile_id", sessionUser.id)
    .in("event_type", SURVEY_EVENTS)
    .limit(1);

  if (error) {
    return NextResponse.json({ eligible: true, source: "supabase", warning: "survey_check_failed" });
  }

  return NextResponse.json({
    eligible: !data?.length,
    source: "supabase",
    survey: data?.[0] || null,
  });
}

export async function POST(request: Request) {
  const sessionUser = await getServerSessionUser();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "prompted");
  const eventType =
    action === "completed"
      ? "soft_launch_survey_completed"
      : action === "dismissed"
        ? "soft_launch_survey_dismissed"
        : "soft_launch_survey_prompted";

  if (!sessionUser?.id) {
    return NextResponse.json({ ok: true, persisted: false, source: "guest" });
  }

  if (!hasSupabaseAdminEnv() || !supabaseAdmin) {
    return NextResponse.json({ ok: true, persisted: false, source: "local" });
  }

  const { error } = await supabaseAdmin.from("feedback_submissions").insert({
    profile_id: sessionUser.id,
    event_type: eventType,
    context: "soft_launch_survey",
    message: `Soft launch survey ${action}.`,
    page_path: "/reasoning",
    metadata: {
      action,
      createdAt: body.createdAt || new Date().toISOString(),
    },
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Survey marker could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true, source: "supabase" });
}
