import { NextResponse } from "next/server";
import {
  schoolActor,
  schoolMutation,
  schoolSnapshot,
  SchoolError,
} from "@/lib/schoolAccess";
import { checkRateLimit } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof SchoolError
          ? error.message
          : "School request failed. Please retry.",
    },
    { status: error instanceof SchoolError ? error.status : 500, headers },
  );
}
export async function GET(request: Request) {
  try {
    const access = await schoolActor();
    return NextResponse.json(
      await schoolSnapshot(
        access,
        new URL(request.url).searchParams.get("schoolId"),
      ),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      throw new SchoolError("Invalid origin.", 403);
    const access = await schoolActor();
    if (!checkRateLimit(`schools:${access.userId}`, 30, 60000).allowed)
      throw new SchoolError("Too many requests. Try again shortly.", 429);
    return NextResponse.json(
      await schoolMutation(access, await request.json()),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
