import { NextResponse } from "next/server";
import {
  classroomActor,
  classroomMutation,
  classroomSnapshot,
  ClassroomError,
} from "@/lib/classroom";
import { checkRateLimit } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof ClassroomError
          ? error.message
          : "Classroom request failed. Please retry.",
    },
    { status: error instanceof ClassroomError ? error.status : 500, headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function GET(request: Request) {
  try {
    const access = await classroomActor();
    const view = new URL(request.url).searchParams.get("view") || "all";
    if (view !== "all" && view !== "teaching" && view !== "learning") throw new ClassroomError("Choose a valid classroom view.");
    return NextResponse.json(
      await classroomSnapshot(
        access,
        new URL(request.url).searchParams.get("classId"),
        view,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      throw new ClassroomError("Invalid origin.", 403);
    const access = await classroomActor();
    if (!checkRateLimit(`classroom:${access.userId}`, 40, 60000).allowed)
      throw new ClassroomError(
        "Too many classroom requests. Try again shortly.",
        429,
      );
    return NextResponse.json(
      await classroomMutation(access, await request.json()),
    );
  } catch (e) {
    return failure(e);
  }
}
