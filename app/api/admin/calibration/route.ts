import { NextResponse } from "next/server";
import { getAccountAccess, permits } from "@/lib/accessControl";
import { checkRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { runReasoningCalibration } from "@/lib/reasoningCalibration";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403, headers },
    );
  const access = await getAccountAccess();
  if (!permits(access, "admin"))
    return NextResponse.json(
      { error: "Platform administrator access required." },
      { status: access.userId ? 403 : 401, headers },
    );
  if (!checkRateLimit(`calibration:${access.userId}`, 1, 300000).allowed)
    return NextResponse.json(
      { error: "Wait five minutes before running another calibration." },
      { status: 429, headers },
    );
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !supabaseAdmin)
    return NextResponse.json(
      { error: "Calibration services are unavailable." },
      { status: 503, headers },
    );
  try {
    const report = await runReasoningCalibration(apiKey);
    const { data, error } = await supabaseAdmin
      .from("reasoning_calibration_runs")
      .insert({ actor_id: access.userId, report })
      .select("id")
      .single();
    if (error)
      return NextResponse.json(
        {
          error: "The calibration ran but its report could not be saved.",
          report,
        },
        { status: 503, headers },
      );
    return NextResponse.json({ id: data.id, report }, { headers });
  } catch {
    return NextResponse.json(
      { error: "Calibration could not be completed." },
      { status: 503, headers },
    );
  }
}
